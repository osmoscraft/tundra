import { callOnce, drainGenerator } from "@tundra/fp-utils";
import { dedicatedWorkerPort, server } from "@tundra/rpc-utils";
import { destoryOpfsByPath, getOpfsFileByPath } from "@tundra/sqlite-utils";
import * as dbApi from "../modules/database";
import { runLiveTests } from "../modules/live-test/run-live-tests";
import {
  searchBacklinkNotes,
  searchNotes,
  searchRecentFiles,
  searchRecentNotes,
  type SearchInput,
} from "../modules/search/search";
import * as sync from "../modules/sync";
import { testConnection } from "../modules/sync/github";
import { type GithubConnection } from "../modules/sync/github/github-config";
import { resetContentBulk } from "../modules/sync/github/operations/reset-content-bulk";
import { updateContentBulk } from "../modules/sync/github/operations/update-content-bulk";
import { addIdByPath, noteIdToPath } from "../modules/sync/path";
import type { RemoteChangeRecord } from "../modules/sync/remote-change-record";
import { formatStatus } from "../modules/sync/status";

export type DataWorkerRoutes = typeof routes;

const DB_PATH = "/database.sqlite3";

const dbInit = callOnce(() => dbApi.init(DB_PATH));
const getDbFile = () => getOpfsFileByPath(DB_PATH);

const routes = {
  checkHealth: async () => dbInit().finally(() => runLiveTests()), // in case test code cause db init to timeout
  destoryDatabase: async () =>
    dbInit()
      .then((db) => db.close())
      .finally(() => destoryOpfsByPath(DB_PATH)),
  getBacklinks: async (id: string) =>
    searchBacklinkNotes(await dbInit(), {
      id,
      limit: 100,
    }).map((note) => ({
      id: note.id,
      title: note.meta?.title,
    })),
  getFile: async (path: string) => dbApi.getFile(await dbInit(), path),
  getNote: async (id: string) => {
    const file = dbApi.getFile(await dbInit(), noteIdToPath(id));
    return file ? addIdByPath(file) : undefined;
  },
  getNoteByUrl: async (url: string) => {
    const file = dbApi.searchFilesByMetaUrl(await dbInit(), { url, limit: 1 })[0];
    return file ? addIdByPath(file) : undefined;
  },
  getDbFile,
  getRecentFiles: async () => searchRecentFiles(await dbInit(), 10),
  getRecentNotes: async () => searchRecentNotes(await dbInit(), 10),
  getStatus: async () => {
    const db = await dbInit();

    return formatStatus({
      hasRemote: !!sync.getGithubRemoteHeadCommit(db),
      stats: dbApi.getSyncStats(db, { ignore: sync.getIgnorePatterns(db) }),
    });
  },
  deleteNote: async (id: string) => dbApi.commit(await dbInit(), { path: noteIdToPath(id), content: null }),
  clone: async (connection: GithubConnection) => {
    const db = await dbInit();
    const { generator, oid } = await sync.getGithubRemote(connection);
    const chunks = await sync.collectGithubRemoteToChunks(100, generator);
    const processChunk = (chunk: RemoteChangeRecord[]) => dbApi.clone(db, chunk.map(sync.GithubChangeToLocalChange));
    performance.mark("clone-start");
    db.transaction(() => chunks.forEach(processChunk));
    sync.setGithubRemoteHeadCommit(db, oid);
    console.log("[perf] clone", performance.measure("clone", "clone-start").duration);
  },
  fetch: async (connection: GithubConnection) => {
    const db = await dbInit();
    if (!sync.isRemoteTracked(db)) return;

    const { generator, remoteHeadRefId } = await sync.getGithubRemoteChanges(db, connection);
    const items = await drainGenerator(generator);
    db.transaction(() => {
      dbApi.fetch(db, items.map(sync.GithubChangeToLocalChange));
    });
    sync.setGithubRemoteHeadCommit(db, remoteHeadRefId);
  },
  merge: async () => {
    const db = await dbInit();

    dbApi.merge(db, {
      paths: dbApi.getDirtyFiles(db, { ignore: sync.getIgnorePatterns(db) }).map((file) => file.path),
    });
  },
  push: async (connection: GithubConnection) => {
    const db = await dbInit();
    if (!sync.isRemoteTracked(db)) return;

    const files = dbApi.getDirtyFiles(db, { ignore: sync.getIgnorePatterns(db) });
    const pushResult = await updateContentBulk(connection, files);
    db.transaction(() => {
      dbApi.push(db, { paths: files.map((file) => file.path) });
      sync.setGithubRemoteHeadCommit(db, pushResult.commitSha);
    });
  },
  resetRemote: async (connection: GithubConnection) => {
    const db = await dbInit();
    const files = dbApi.getFiles(db, { ignore: sync.getIgnorePatterns(db) });
    const pushResult = await resetContentBulk(connection, files);
    db.transaction(() => {
      dbApi.clone(db, files);
      sync.setGithubRemoteHeadCommit(db, pushResult.commitSha);
    });
  },
  resolve: async () => {
    const db = await dbInit();
    dbApi.resolve(db, {
      paths: dbApi.getDirtyFiles(db, { ignore: sync.getIgnorePatterns(db) }).map((file) => file.path),
    });
  },
  searchNotes: async (input: SearchInput) => searchNotes(await dbInit(), input),
  testGithubConnection: async (connection: GithubConnection) => testConnection(connection),
  writeNote: async (id: string, content: string) => dbApi.commit(await dbInit(), { path: noteIdToPath(id), content }),
};

dbInit(); // start db init early to reduce response time
server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });
