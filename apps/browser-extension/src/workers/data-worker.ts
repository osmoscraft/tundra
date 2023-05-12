import { dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { checkHealth, fsDbAsync, listFiles, readFile, writeFile } from "../modules/file-system";

export type DataWorkerRoutes = typeof routes;

const routes = {
  checkHealth,
  writeFile: (path: string, content: string) => fsDbAsync().then((db) => writeFile(db, path, "text/plain", content)),
  getFile: (path: string) => fsDbAsync().then((db) => readFile(db, path)),
  listFiles: () => fsDbAsync().then((db) => listFiles(db, 10, 0)),
};

server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");
