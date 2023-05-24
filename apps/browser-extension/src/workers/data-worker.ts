import { asyncPipe, exhaustIterator, filterIteratorAsync, mapIteratorAsync, tap } from "@tinykb/fp-utils";
import { client, dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { destoryOpfsByPath, getOpfsFileByPath } from "@tinykb/sqlite-utils";
import * as fs from "../modules/file-system";
import type { GithubConnection } from "../modules/sync";
import * as sync from "../modules/sync";
import { ensureFetchParameters } from "../modules/sync/fetch";
import { getArchive } from "../modules/sync/github";
import { ChangeType, updateContentBulk } from "../modules/sync/github/operations/update-content-bulk";
import { mergeChangedFile } from "../modules/sync/merge";
import { ensurePushParameters, fileChangeToBulkFileChangeItem } from "../modules/sync/push";
import { formatStatus } from "../modules/sync/status";
import type { NotebookRoutes } from "../pages/notebook";

export type DataWorkerRoutes = typeof routes;

const FS_DB_PATH = "/tinykb-fs.sqlite3";
const SYNC_DB_PATH = "/tinykb-sync.sqlite3";
const fsInit = fs.init.bind(null, FS_DB_PATH);
const syncInit = sync.init.bind(null, SYNC_DB_PATH);

const { proxy } = client<NotebookRoutes>({ port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

const routes = {
  checkHealth: asyncPipe(
    tap(() => console.log("check fs")),
    fs.checkHealth,
    tap(() => console.log("check sync")),
    sync.checkHealth
  ),
  clearFiles: async () => Promise.all([fs.clear(await fsInit()), sync.clearHistory(await syncInit())]),
  fetchGithub: async () => {
    const syncDb = await syncInit();
    const { connection, localHeadRefId, remoteHeadRefId } = await ensureFetchParameters(syncDb);

    const generator = sync.iterateGitHubDiffs(connection, localHeadRefId, remoteHeadRefId);
    const mdGenerator = filterIteratorAsync((item) => item.path.endsWith(".md"), generator);
    // TODO convert iterator to promise array for parallel processing
    const mappedGenerator = mapIteratorAsync(async (item) => {
      await sync.trackRemoteChange(syncDb, item.path, await item.readText(), await item.readTimestamp());
    }, mdGenerator);
    await exhaustIterator(mappedGenerator);

    await proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));
  },
  getFile: async (path: string) => fs.readFile(await fsInit(), path),
  getFsDbFile: getOpfsFileByPath.bind(null, FS_DB_PATH),
  getGithubConnection: asyncPipe(syncInit, sync.getConnection),
  getSyncDbFile: getOpfsFileByPath.bind(null, SYNC_DB_PATH),
  importGitHubRepo: async () => {
    const fsDb = await fsInit();
    const syncDb = await syncInit();
    const { connection } = await sync.ensureCloneParameters(syncDb);
    await Promise.all([fs.clear(fsDb), sync.clearHistory(syncDb)]);
    const archive = await getArchive(connection);
    const generator = sync.iterateGitHubArchive(archive.zipballUrl);
    const mdGenerator = filterIteratorAsync((item) => item.path.endsWith(".md"), generator);
    const mappedGenerator = mapIteratorAsync(async (item) => {
      const content = await item.readText();
      await sync.trackRemoteChangeNow(syncDb, item.path, content);
      await fs.writeFile(fsDb, item.path, "text/markdown", content!);
      await sync.trackLocalChangeNow(syncDb, item.path, content);
    }, mdGenerator);

    await exhaustIterator(mappedGenerator);
    sync.setGithubRef(syncDb, archive.oid);
  },
  listFiles: async () => fs.listFiles(await fsInit(), 10, 0),
  pullGitHub: async () => {
    // TODO split merge from pull
    const fsDb = await fsInit();
    const syncDb = await syncInit();
    const { connection, localHeadRefId, remoteHeadRefId } = await ensureFetchParameters(syncDb);

    const generator = sync.iterateGitHubDiffs(connection, localHeadRefId, remoteHeadRefId);
    const mdGenerator = filterIteratorAsync((item) => item.path.endsWith(".md"), generator);
    const mappedGenerator = mapIteratorAsync(async (item) => {
      const newContent = await item.readText();
      await sync.trackRemoteChange(syncDb, item.path, newContent, await item.readTimestamp());
      const fileChange = sync.getRemoteFileChange(syncDb, item.path);
      if (fileChange) {
        await mergeChangedFile(fsDb, item.path, newContent);
        await sync.trackLocalChangeNow(syncDb, item.path, newContent);
      }
    }, mdGenerator);
    await exhaustIterator(mappedGenerator);

    await proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));

    sync.setGithubRef(syncDb, remoteHeadRefId);
    await proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));
  },
  pushGitHub: async () => {
    const syncDb = await syncInit();
    const fsDb = await fsInit();
    const { connection } = ensurePushParameters(syncDb);
    const localFileChanges = sync.getLocalFileChanges(syncDb);
    const fileChanges = localFileChanges.map(fileChangeToBulkFileChangeItem.bind(null, fsDb));
    const pushResult = await updateContentBulk(connection, fileChanges);

    await Promise.all(
      fileChanges.map((file) =>
        sync.trackRemoteChangeNow(syncDb, file.path, file.changeType === ChangeType.Remove ? null : file.content)
      )
    );

    sync.setGithubRef(syncDb, pushResult.commitSha);
    await proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));
  },
  rebuild: () => Promise.all([destoryOpfsByPath(FS_DB_PATH), destoryOpfsByPath(SYNC_DB_PATH)]),
  setGithubConnection: async (connection: GithubConnection) => sync.setConnection(await syncInit(), connection),
  testGithubConnection: asyncPipe(syncInit, sync.testConnection),
  writeFile: async (path: string, content: string) => {
    const syncDb = await syncInit();
    await fs.writeFile(await fsInit(), path, "text/markdown", content);
    await sync.trackLocalChangeNow(await syncInit(), path, content);
    await proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));
  },
};

server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");

// on start, report change status
syncInit().then((db) => proxy.setStatus(formatStatus(sync.getFileChanges(db))));
