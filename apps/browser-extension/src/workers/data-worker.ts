import { asyncPipe, callOnce, drainGenerator, pipe } from "@tinykb/fp-utils";
import { dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { destoryOpfsByPath, getOpfsFileByPath } from "@tinykb/sqlite-utils";
import * as dbApi from "../modules/database";
import { searchNotes, searchRecentNotes, type SearchInput } from "../modules/search/search";
import type { GithubConnection } from "../modules/sync";
import * as sync from "../modules/sync";
import { updateContentBulk } from "../modules/sync/github/operations/update-content-bulk";
import { ensurePushParameters } from "../modules/sync/push";
import type { RemoteChangeRecord } from "../modules/sync/remote-change-record";
import { formatStatus } from "../modules/sync/status";

export type DataWorkerRoutes = typeof routes;

const DB_PATH = "/tinykb-db.sqlite3";

const dbInit = callOnce(() => dbApi.init(DB_PATH));
const getDbFile = () => getOpfsFileByPath(DB_PATH);
const destoryAll = () => destoryOpfsByPath(DB_PATH);

const routes = {
  checkHealth: async () => dbInit().finally(() => dbApi.testDatabase()), // in case test code cause db init to timeout
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
  getRecentFiles: async () => searchRecentNotes(await dbInit(), 10),
  getStatus: async () => {
    const db = await dbInit();
    const dirtyFiles = dbApi.listDirtyFiles(db, sync.getUserIgnores(db));
    return formatStatus(dirtyFiles.ahead.length, dirtyFiles.behind.length, dirtyFiles.conflict.length);
  },
  clone: async () => {
    const db = await dbInit();
    await routes.destoryData();
    const { generator, oid } = await sync.getGithubRemote(db);
    const chunks = await sync.collectGithubRemoteToChunks(100, generator);
    const processChunk = (chunk: RemoteChangeRecord[]) => dbApi.clone(db, chunk.map(sync.GithubChangeToLocalChange));
    performance.mark("clone-start");
    db.transaction(() => chunks.forEach(processChunk));
    sync.setGithubRemoteHeadCommit(db, oid);
    console.log("[perf] clone", performance.measure("clone", "clone-start").duration);
  },
  fetch: async () => {
    const db = await dbInit();
    const { generator, remoteHeadRefId } = await sync.getGitHubRemoteChanges(db);
    const items = await drainGenerator(generator);
    db.transaction(() => {
      dbApi.fetch(db, items.map(sync.GithubChangeToLocalChange));
    });
    sync.setGithubRemoteHeadCommit(db, remoteHeadRefId);
  },
  merge: async () => {
    debugger;
    const db = await dbInit();
    const files = dbApi.listDirtyFiles(db, sync.getUserIgnores(db)).behind;
    const graphSources = files.map(dbApi.parseDbFileToGraphSource);
    dbApi.merge(db, graphSources);
  },
  push: async () => {
    const db = await dbInit();
    const { connection } = ensurePushParameters(db);
    const files = dbApi.listDirtyFiles(db, sync.getUserIgnores(db)).ahead;
    const fileChanges = files.map(sync.localChangedFileToBulkFileChangeItem);
    const pushTime = Date.now();
    const pushResult = await updateContentBulk(connection, fileChanges);
    const graphSources = files.map(pipe(dbApi.parseDbFileToGraphSource, dbApi.setUpdatedAt.bind(null, pushTime)));
    db.transaction(() => {
      dbApi.push(db, graphSources);
      sync.setGithubRemoteHeadCommit(db, pushResult.commitSha);
    });
  },
  search: async (input: SearchInput) => searchNotes(await dbInit(), input),
  setGithubConnection: async (connection: GithubConnection) => sync.setConnection(await dbInit(), connection),
  testGithubConnection: asyncPipe(dbInit, sync.testConnection),
  writeFile: async (path: string, content: string) => {
    const db = await dbInit();
    dbApi.commit(db, { path, content });
  },
};

dbInit(); // start db init early to reduce response time
server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });
