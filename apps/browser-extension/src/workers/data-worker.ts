import { asyncPipe, exhaustIterator, mapIteratorAsync, tap } from "@tinykb/fp-utils";
import { client, dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { destoryOpfsByPath, getOpfsFileByPath } from "@tinykb/sqlite-utils";
import * as fs from "../modules/file-system";
import type { GithubConnection } from "../modules/sync";
import * as sync from "../modules/sync";
import { trackRemoteChange } from "../modules/sync";
import { ensureFetchParameters, getGitHubChangedFileContent, getGitHubChangedFiles } from "../modules/sync/fetch";
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

  getFile: async (path: string) => fs.readFile(await fsInit(), path),
  getFsDbFile: getOpfsFileByPath.bind(null, FS_DB_PATH),
  getGithubConnection: asyncPipe(syncInit, sync.getConnection),
  getSyncDbFile: getOpfsFileByPath.bind(null, SYNC_DB_PATH),
  importGitHubRepo: asyncPipe(
    // TODO refactor to expose ref update logic
    async () => Promise.all([fs.clear(await fsInit()), sync.clearHistory(await syncInit())]),
    async () => sync.importGithubItems(await syncInit()),
    async (generator: AsyncGenerator<sync.GitHubItem>) =>
      mapIteratorAsync(async (item) => {
        await fs.writeFile(await fsInit(), item.path, "text/markdown", item.content);
        await sync.trackLocalChange(await syncInit(), item.path, item.content);
      }, generator),
    exhaustIterator
  ),
  listFiles: async () => fs.listFiles(await fsInit(), 10, 0),
  rebuild: () => Promise.all([destoryOpfsByPath(FS_DB_PATH), destoryOpfsByPath(SYNC_DB_PATH)]),
  setGithubConnection: async (connection: GithubConnection) => sync.setConnection(await syncInit(), connection),
  fetchGithub: async () => {
    const fsDb = await fsInit();
    const syncDb = await syncInit();
    const { connection, localHeadRefId, remoteHeadRefId } = await ensureFetchParameters(syncDb);

    const onCompareResultFile = async (file: CompareResultFile) =>
      sync.trackRemoteChange(syncDb, file.filename, await getGitHubChangedFileContent(connection, fsDb, file));

    await getGitHubChangedFiles(connection, localHeadRefId, remoteHeadRefId).then((files) =>
      Promise.all(files.filter((file) => githubPathToLocalPath(file.filename)).map(onCompareResultFile))
    );

    await proxy.setStatus(formatStatus(sync.getChangedFiles(syncDb)));
  },
  pullGitHub: async () => {
    const fsDb = await fsInit();
    const syncDb = await syncInit();
    const { connection, localHeadRefId, remoteHeadRefId } = await ensureFetchParameters(syncDb);

    const onCompareResultFile = async (file: CompareResultFile) => {
      const latestContent = await getGitHubChangedFileContent(connection, fsDb, file);
      await sync.trackRemoteChange(syncDb, file.filename, latestContent);
      await mergeChangedFile(fsDb, file.filename, latestContent);
      await sync.trackLocalChange(syncDb, file.filename, latestContent);
    };

    await getGitHubChangedFiles(connection, localHeadRefId, remoteHeadRefId).then((files) =>
      Promise.all(files.filter((file) => githubPathToLocalPath(file.filename)).map(onCompareResultFile))
    );

    sync.setGithubRef(syncDb, remoteHeadRefId);

    await proxy.setStatus(formatStatus(sync.getChangedFiles(syncDb)));
  },
  pushGitHub: async () => {
    const syncDb = await syncInit();
    const fsDb = await fsInit();
    const { connection } = ensurePushParameters(syncDb);
    const localFileChanges = sync.getLocalChangedFiles(syncDb);

    const fileChanges = localFileChanges.map(fileChangeToBulkFileChangeItem.bind(null, fsDb));

    if (!fileChanges.length) {
      console.log("Nothing to push");
      return;
    }

    const pushResult = await updateContentBulk(connection, fileChanges);

    await Promise.all(
      fileChanges.map((file) =>
        trackRemoteChange(syncDb, file.path, file.changeType === ChangeType.Remove ? null : file.content)
      )
    );

    sync.setGithubRef(syncDb, pushResult.commitSha);

    await proxy.setStatus(formatStatus(sync.getChangedFiles(syncDb)));
  },
  testGithubConnection: asyncPipe(syncInit, sync.testConnection),
  writeFile: async (path: string, content: string) => {
    await fs.writeFile(await fsInit(), path, "text/markdown", content);
    await sync.trackLocalChange(await syncInit(), path, content);
  },
};

server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");

// on start, report change status
syncInit().then((db) => proxy.setStatus(formatStatus(sync.getChangedFiles(db))));
