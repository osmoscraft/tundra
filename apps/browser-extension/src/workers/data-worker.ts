import { asyncPipe, tap } from "@tinykb/fp-utils";
import { dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { checkFsHealth, fsDbAsync, listFiles, readFile, writeFile } from "../modules/file-system";
import { checkSyncHealth } from "../modules/sync-v2";

export type DataWorkerRoutes = typeof routes;

const routes = {
  checkHealth: asyncPipe(
    tap(() => console.log("check fs")),
    checkFsHealth,
    tap(() => console.log("check sync")),
    checkSyncHealth
  ),
  writeFile: (path: string, content: string) => fsDbAsync().then((db) => writeFile(db, path, "text/plain", content)),
  getFile: (path: string) => fsDbAsync().then((db) => readFile(db, path)),
  listFiles: () => fsDbAsync().then((db) => listFiles(db, 10, 0)),
};

server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");
