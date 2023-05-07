import { asyncPipe } from "@tinykb/fp-utils";
import { dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { checkHealth, fsDbAsync, listFiles, safeFileWriter } from "../modules/file-system";

export type DataWorkerRoutes = typeof routes;

function preWriteFile() {}
function postWriteFile() {}

const routes = {
  checkHealth,
  writeFile: safeFileWriter(preWriteFile, postWriteFile),
  listFiles: asyncPipe(fsDbAsync, (db: Sqlite3.DB) => listFiles(db, 10, 0)),
};

console.log("will attach server");
server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");
