import { asyncPipe } from "@tinykb/fp-utils";
import { dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import {
  checkHealth,
  fsDbAsync,
  listFiles,
  safeFileWriter,
  type PostWriteHook,
  type PreWriteHook,
} from "../modules/file-system";

export type DataWorkerRoutes = typeof routes;

const preWriteFile: PreWriteHook = (input) => {};
const postWriteFile: PostWriteHook = (input) => {};
const writeFile = safeFileWriter(preWriteFile, postWriteFile);

const routes = {
  checkHealth,
  writeFile,
  listFiles: asyncPipe(fsDbAsync, (db: Sqlite3.DB) => listFiles(db, 10, 0)),
};

console.log("will attach server");
server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");
