import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { client, dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { destoryOpfsByPath, getOpfsFileByPath } from "@tinykb/sqlite-utils";
import * as dbApi from "../modules/database";
import { searchNotes, searchRecentNotes, type SearchInput } from "../modules/search/search";
import type { GithubConnection } from "../modules/sync";
import * as sync from "../modules/sync";
import { updateContentBulk } from "../modules/sync/github/operations/update-content-bulk";
import { ensurePushParameters } from "../modules/sync/push";
import type { RemoteChangeRecord } from "../modules/sync/remote-change-record";
import { formatStatus } from "../modules/sync/status";
import type { NotebookRoutes } from "../pages/notebook";

export type DataWorkerRoutes = typeof routes;

const DB_PATH = "/tinykb-db.sqlite3";

const { proxy } = client<NotebookRoutes>({ port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

const dbInit = callOnce(() => dbApi.init(DB_PATH));
const getDbFile = () => getOpfsFileByPath(DB_PATH);
const destoryAll = () => destoryOpfsByPath(DB_PATH);

const routes = {
  checkHealth: () => dbApi.testDatabase(),
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
  clone: async () => {
    const db = await dbInit();
    await routes.destoryData();
    const { generator, oid } = await sync.getGithubRemote(db);
    const chunks = await sync.collectGithubRemoteToChunks(100, generator);
    const processChunk = (chunk: RemoteChangeRecord[]) =>
      dbApi.updateRemote(db, chunk.map(sync.GithubChangeToLocalChange));
    db.transaction(() => chunks.forEach(processChunk));
    sync.setGithubRemoteHeadCommit(db, oid);
  },
  pull: async () => {
    const db = await dbInit();
    const { generator, remoteHeadRefId } = await sync.getGitHubRemoteChanges(db);
    const chunks = await sync.collectGithubRemoteToChunks(100, generator);
    const processChunk = (chunk: RemoteChangeRecord[]) => {
      const fileChanges = chunk.map(sync.GithubChangeToLocalChange);
      // TODO encapsulate all dbApi calls into version control module
      dbApi.updateRemote(db, fileChanges);
      dbApi.updateLocal(db, fileChanges); // TODO: skip write if local timestamp is newer
    };

    db.transaction(() => chunks.forEach(processChunk));
    sync.setGithubRemoteHeadCommit(db, remoteHeadRefId);
    await proxy.setStatus(formatStatus(dbApi.getDirtyFiles(db, sync.getUserIgnores(db))));
  },
  push: async () => {
    const db = await dbInit();
    const { connection } = ensurePushParameters(db);
    const files = dbApi.getDirtyFiles(db, sync.getUserIgnores(db));
    const fileChanges = files.map(sync.localChangedFileToBulkFileChangeItem);
    const pushResult = await updateContentBulk(connection, fileChanges);

    // TODO encapsulate
    files
      .map((dbFile) => ({
        path: dbFile.path,
        content: dbFile.content,
        updatedAt: Date.now(), // TODO use push commit timestamp
      }))
      .map((file) => dbApi.updateRemote(db, file));
    sync.setGithubRemoteHeadCommit(db, pushResult.commitSha);

    await proxy.setStatus(formatStatus(dbApi.getDirtyFiles(db, sync.getUserIgnores(db))));
  },
  search: async (input: SearchInput) => searchNotes(await dbInit(), input),
  setGithubConnection: async (connection: GithubConnection) => sync.setConnection(await dbInit(), connection),
  testGithubConnection: asyncPipe(dbInit, sync.testConnection),
  writeFile: async (path: string, content: string) => {
    const db = await dbInit();
    dbApi.updateLocal(db, { path, content });
    await proxy.setStatus(formatStatus(dbApi.getDirtyFiles(db, sync.getUserIgnores(db))));
  },
};

server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

(async function init() {
  const db = await dbInit();
  await proxy.setStatus(formatStatus(dbApi.getDirtyFiles(db, sync.getUserIgnores(db))));
  console.log("[data worker] initialized");
})();
