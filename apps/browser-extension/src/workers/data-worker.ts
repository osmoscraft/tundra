import { asyncPipe, exhaustIterator, mapIteratorAsync, tap } from "@tinykb/fp-utils";
import { client, dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { destoryOpfsByPath, getOpfsFileByPath } from "@tinykb/sqlite-utils";
import * as fs from "../modules/file-system";
import type { GithubConnection } from "../modules/sync";
import * as sync from "../modules/sync";
import { compare } from "../modules/sync/github/operations/compare";
import { getRemoteHeadRef } from "../modules/sync/github/operations/get-remote-head-ref";
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
    async () => Promise.all([fs.clear(await fsInit()), sync.clearHistory(await syncInit())]),
    async () => sync.importGithubItems(await syncInit()),
    async (generator: AsyncGenerator<sync.GitHubItem>) =>
      mapIteratorAsync(async (item) => {
        await fs.writeFile(await fsInit(), item.path, "text/plain", item.content);
        await sync.trackLocalChange(await syncInit(), item.path, item.content);
      }, generator),
    exhaustIterator
  ),
  listFiles: async () => fs.listFiles(await fsInit(), 10, 0),
  rebuild: () => Promise.all([destoryOpfsByPath(FS_DB_PATH), destoryOpfsByPath(SYNC_DB_PATH)]),
  setGithubConnection: async (connection: GithubConnection) => sync.setConnection(await syncInit(), connection),
  syncGitHubRepo: async () => {
    // ensure connection
    const connection = await sync.getConnection(await syncInit());
    if (!connection) throw new Error("Missing connection");
    // fetch
    const localHeadRefId = sync.getGithubRef(await syncInit())?.id;
    if (!localHeadRefId) throw new Error("Local repo uninitialized");

    const remoteHeadRefId = await getRemoteHeadRef(connection);
    if (remoteHeadRefId === localHeadRefId) return; // up to date

    const compareResults = await compare(connection, { base: localHeadRefId, head: remoteHeadRefId });
    console.log(compareResults);

    // merge
    // push
    // status update
  },
  testGithubConnection: asyncPipe(syncInit, sync.testConnection),
  writeFile: async (path: string, content: string) => {
    await fs.writeFile(await fsInit(), path, "text/plain", content);
    await sync.trackLocalChange(await syncInit(), path, content);
  },
};

server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");

// on start, report change status
syncInit().then((db) => proxy.setStatus(formatStatus(sync.getChangedFiles(db))));
