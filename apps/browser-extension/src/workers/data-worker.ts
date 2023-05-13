import { asyncPipe, tap } from "@tinykb/fp-utils";
import { dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { destoryOpfsByPath, getOpfsFileByPath } from "@tinykb/sqlite-utils";
import * as fs from "../modules/file-system";
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
  listFiles: () => fsInit().then((db) => fs.listFiles(db, 10, 0)),
  rebuild: () => Promise.all([destoryOpfsByPath(FS_DB_PATH), destoryOpfsByPath(SYNC_DB_PATH)]),
  writeFile: (path: string, content: string) => fsInit().then((db) => fs.writeFile(db, path, "text/plain", content)),
};

server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");
