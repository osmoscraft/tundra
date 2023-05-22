import { asyncPipe, exhaustIterator, mapIteratorAsync, tap } from "@tinykb/fp-utils";
import { client, dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { destoryOpfsByPath, getOpfsFileByPath } from "@tinykb/sqlite-utils";
import * as fs from "../modules/file-system";
import type { GithubConnection } from "../modules/sync";
import * as sync from "../modules/sync";
import { ensureFetchParameters, getGitHubChangedFileContent, getGitHubChangedFiles } from "../modules/sync/fetch";
import { getArchive } from "../modules/sync/github";
import { type CompareResultFile } from "../modules/sync/github/operations/compare";
import { ChangeType, updateContentBulk } from "../modules/sync/github/operations/update-content-bulk";
import { mergeChangedFile } from "../modules/sync/merge";
import { githubPathToLocalPath } from "../modules/sync/path";
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
    const fsDb = await fsInit();
    const syncDb = await syncInit();
    const { connection, localHeadRefId, remoteHeadRefId } = await ensureFetchParameters(syncDb);

    const onCompareResultFile = async (file: CompareResultFile) => {
      const isLocalClean = !sync.getLocalFileChange(syncDb, file.filename);
      sync.trackRemoteChange(
        syncDb,
        file.filename,
        await getGitHubChangedFileContent(connection, fsDb, file, isLocalClean)
      );
    };

    await getGitHubChangedFiles(connection, localHeadRefId, remoteHeadRefId).then((files) =>
      Promise.all(files.filter((file) => githubPathToLocalPath(file.filename)).map(onCompareResultFile))
    );

    await proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));
  },
  getFile: async (path: string) => fs.readFile(await fsInit(), path),
  getFsDbFile: getOpfsFileByPath.bind(null, FS_DB_PATH),
  getGithubConnection: asyncPipe(syncInit, sync.getConnection),
  getSyncDbFile: getOpfsFileByPath.bind(null, SYNC_DB_PATH),
  importGitHubRepo: async () => {
    const fsDb = await fsInit();
    const syncDb = await syncInit();
    const { connection } = await sync.ensureImportParameters(syncDb);
    await Promise.all([fs.clear(fsDb), sync.clearHistory(syncDb)]);
    const archive = await getArchive(connection);
    const generator = sync.importGithubArchive(archive.zipballUrl);
    const mappedGenerator = mapIteratorAsync(async (item) => {
      await sync.trackRemoteChange(syncDb, item.path, item.content);
      // todo: consolicate with mergeChangedFile()
      await fs.writeFile(fsDb, item.path, "text/markdown", item.content);
      await sync.trackLocalChange(await syncInit(), item.path, item.content);
    }, generator);

    await exhaustIterator(mappedGenerator);
    sync.setGithubRef(syncDb, archive.oid);
  },
  listFiles: async () => fs.listFiles(await fsInit(), 10, 0),
  pullGitHub: async () => {
    const fsDb = await fsInit();
    const syncDb = await syncInit();
    const { connection, localHeadRefId, remoteHeadRefId } = await ensureFetchParameters(syncDb);

    const onCompareResultFile = async (file: CompareResultFile) => {
      const isLocalClean = !sync.getLocalFileChange(syncDb, file.filename);
      const latestContent = await getGitHubChangedFileContent(connection, fsDb, file, isLocalClean);
      await sync.trackRemoteChange(syncDb, file.filename, latestContent);
      if (isLocalClean) {
        await mergeChangedFile(fsDb, file.filename, latestContent);
        await sync.trackLocalChange(syncDb, file.filename, latestContent);
      }
    };

    await getGitHubChangedFiles(connection, localHeadRefId, remoteHeadRefId).then((files) =>
      Promise.all(files.filter((file) => githubPathToLocalPath(file.filename)).map(onCompareResultFile))
    );

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
        sync.trackRemoteChange(syncDb, file.path, file.changeType === ChangeType.Remove ? null : file.content)
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
    await sync.trackLocalChange(await syncInit(), path, content);
    await proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));
  },
};

server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");

// on start, report change status
syncInit().then((db) => proxy.setStatus(formatStatus(sync.getFileChanges(db))));
