import { asyncPipe, exhaustIterator, mapIteratorAsync, tap } from "@tinykb/fp-utils";
import { dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { destoryOpfsByPath, getOpfsFileByPath } from "@tinykb/sqlite-utils";
import * as fs from "../modules/file-system";
import type { GithubConnection } from "../modules/sync-v2";
import * as sync from "../modules/sync-v2";

export type DataWorkerRoutes = typeof routes;

const FS_DB_PATH = "/tinykb-fs.sqlite3";
const SYNC_DB_PATH = "/tinykb-sync.sqlite3";
const fsInit = fs.init.bind(null, FS_DB_PATH);
const syncInit = sync.init.bind(null, SYNC_DB_PATH);

const routes = {
  checkHealth: asyncPipe(
    tap(() => console.log("check fs")),
    fs.checkHealth,
    tap(() => console.log("check sync")),
    sync.checkHealth
  ),
  clearFiles: () => Promise.all([fsInit().then((db) => fs.clear(db)), syncInit().then((db) => sync.clearHistory(db))]),
  getFile: (path: string) => fsInit().then((db) => fs.readFile(db, path)),
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
  listFiles: () => fsInit().then((db) => fs.listFiles(db, 10, 0)),
  rebuild: () => Promise.all([destoryOpfsByPath(FS_DB_PATH), destoryOpfsByPath(SYNC_DB_PATH)]),
  setGithubConnection: (connection: GithubConnection) => syncInit().then((db) => sync.setConnection(db, connection)),
  testGithubConnection: asyncPipe(syncInit, sync.testConnection),
  writeFile: async (path: string, content: string) => {
    fs.writeFile(await fsInit(), path, "text/plain", content);
    sync.trackLocalChange(await syncInit(), path, content);
  },
};

server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");
