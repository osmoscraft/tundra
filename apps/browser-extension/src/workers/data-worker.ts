import { asyncPipe, exhaustGenerator, mapAsyncGenerator } from "@tinykb/fp-utils";
import { client, dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { destoryOpfsByPath, getOpfsFileByPath } from "@tinykb/sqlite-utils";
import * as dbApi from "../modules/database";
import * as fs from "../modules/file-system";
import type { GithubConnection } from "../modules/sync";
import * as sync from "../modules/sync";
import { updateContentBulk } from "../modules/sync/github/operations/update-content-bulk";
import { ensurePushParameters } from "../modules/sync/push";
import { formatStatus } from "../modules/sync/status";
import type { NotebookRoutes } from "../pages/notebook";

export type DataWorkerRoutes = typeof routes;

const DB_PATH = "/tinykb-db.sqlite3";

const { proxy } = client<NotebookRoutes>({ port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

const dbInit = () => dbApi.init(DB_PATH);
const getDbFile = () => getOpfsFileByPath(DB_PATH);
const destoryAll = () => destoryOpfsByPath(DB_PATH);

const routes = {
  checkHealth: () => dbApi.testDatabase(),
  clearFiles: async () => {
    const db = await dbInit();
    Promise.all([dbApi.deleteAllFiles(db), dbApi.deleteAllNodes(db), sync.clearHistory(db)]);
  },
  destoryData: async () => {
    const db = await dbInit();
    const connection = sync.getConnection(db);

    await destoryAll();

    if (connection) {
      const newDb = await dbApi.init(DB_PATH);
      sync.setConnection(newDb, connection);
    }
  },
  destoryAll,
  getFile: async (path: string) => dbApi.getFile(await dbInit(), path),
  getDbFile,
  getGithubConnection: async () => sync.getConnection(await dbInit()),
  getRecentFiles: async () => dbApi.getRecentFiles(await dbInit(), 10),
  clone: async () => {
    const db = await dbInit();
    await Promise.all([dbApi.deleteAllFiles(db), sync.clearHistory(db)]);

    const { generator, oid } = await sync.getGitHubRemote(db);

    await exhaustGenerator(
      mapAsyncGenerator(async (item) => {
        // TODO convert to chunked bulk insert
        dbApi.setRemoteFile(db, {
          path: item.path,
          content: item.text,
          updatedTime: item.timestamp,
        });

        dbApi.setNode(db, {
          path: item.path,
          title: item.text?.slice(0, 100) ?? "Untitled", // mock
        });
      }, generator)
    );

    sync.setGithubRemoteHeadCommit(db, oid);
  },
  pull: async () => {
    const db = await dbInit();
    const { generator, remoteHeadRefId } = await sync.getGitHubRemoteChanges(db);

    await exhaustGenerator(
      mapAsyncGenerator(async (item) => {
        dbApi.setRemoteFile(db, {
          path: item.path,
          content: item.text,
          updatedTime: item.timestamp,
        });
        // skip write if local is ahead
        dbApi.setLocalFile(db, {
          path: item.path,
          content: item.text,
          updatedTime: item.timestamp,
        });

        dbApi.setNode(db, {
          path: item.path,
          title: item.text?.slice(0, 100) ?? "Untitled", // mock
        });
      }, generator)
    );

    sync.setGithubRemoteHeadCommit(db, remoteHeadRefId);
    await proxy.setStatus(formatStatus(dbApi.getDirtyFiles(db)));
  },
  push: async () => {
    const db = await dbInit();
    const { connection } = ensurePushParameters(db);
    const dirtyFiles = dbApi.getDirtyFiles(db);
    const fileChanges = dirtyFiles.map(sync.dirtyFileToBulkFileChangeItem);
    const pushResult = await updateContentBulk(connection, fileChanges);

    dirtyFiles
      .map((dbFile) => ({
        path: dbFile.path,
        content: dbFile.content,
        updatedTime: new Date().toISOString(), // TODO use push commit timestamp
      }))
      .map((file) => dbApi.setRemoteFile(db, file));
    sync.setGithubRemoteHeadCommit(db, pushResult.commitSha);

    await proxy.setStatus(formatStatus(dbApi.getDirtyFiles(db)));
  },
  runBenchmark: fs.runBenchmark,
  searchNodes: async (query: string) => dbApi.searchNodes(await dbInit(), { query, limit: 10 }),
  setGithubConnection: async (connection: GithubConnection) => sync.setConnection(await dbInit(), connection),
  testGithubConnection: asyncPipe(dbInit, sync.testConnection),
  writeFile: async (path: string, content: string) => {
    const db = await dbInit();
    dbApi.setLocalFile(db, { path, content });
    dbApi.setNode(db, {
      path,
      title: content.slice(0, 100) ?? "Untitled", // mock
    });
    await proxy.setStatus(formatStatus(dbApi.getDirtyFiles(db)));
  },
};

server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

(async function init() {
  const db = await dbInit();

  // on start, report change status
  await proxy.setStatus(formatStatus(dbApi.getDirtyFiles(db)));

  console.log("[data worker] initialized");
})();
