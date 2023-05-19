import { applyPatch, parsePatch } from "diff";

import { asyncPipe, exhaustIterator, mapIteratorAsync, tap } from "@tinykb/fp-utils";
import { client, dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { destoryOpfsByPath, getOpfsFileByPath } from "@tinykb/sqlite-utils";
import * as fs from "../modules/file-system";
import DELETE_FILE from "../modules/file-system/sql/delete-file.sql";
import SELECT_FILE from "../modules/file-system/sql/select-file.sql";
import UPSERT_FILE from "../modules/file-system/sql/upsert-file.sql";
import type { GithubConnection } from "../modules/sync";
import * as sync from "../modules/sync";
import { b64DecodeUnicode } from "../modules/sync/github/base64";
import { compare } from "../modules/sync/github/operations/compare";
import { getBlob } from "../modules/sync/github/operations/get-blob";
import { getRemoteHeadRef } from "../modules/sync/github/operations/get-remote-head-ref";
import { formatStatus } from "../modules/sync/status";
import type { NotebookRoutes } from "../pages/notebook";

export type DataWorkerRoutes = typeof routes;

const FS_DB_PATH = "/tinykb-fs.sqlite3";
const SYNC_DB_PATH = "/tinykb-sync.sqlite3";
const fsInit = fs.init.bind(null, FS_DB_PATH);
const syncInit = sync.init.bind(null, SYNC_DB_PATH);

const { proxy } = client<NotebookRoutes>({ port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

const routes = {
  checkHealth: asyncPipe(
    tap(() => console.log("check fs")),
    fs.checkHealth,
    tap(() => console.log("check sync")),
    sync.checkHealth
  ),
  clearFiles: async () => Promise.all([fs.clear(await fsInit()), sync.clearHistory(await syncInit())]),
  fetchGithub: async () => {
    // TBD
  },
  getFile: async (path: string) => fs.readFile(await fsInit(), path),
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
  listFiles: async () => fs.listFiles(await fsInit(), 10, 0),
  rebuild: () => Promise.all([destoryOpfsByPath(FS_DB_PATH), destoryOpfsByPath(SYNC_DB_PATH)]),
  setGithubConnection: async (connection: GithubConnection) => sync.setConnection(await syncInit(), connection),
  syncGitHub: async () => {
    // ensure connection
    const connection = await sync.getConnection(await syncInit());
    if (!connection) throw new Error("Missing connection");
    // fetch
    const localHeadRefId = sync.getGithubRef(await syncInit())?.id;
    if (!localHeadRefId) throw new Error("Local repo uninitialized");

    const remoteHeadRefId = await getRemoteHeadRef(connection);
    if (remoteHeadRefId === localHeadRefId) {
      await proxy.setStatus(formatStatus(sync.getChangedFiles(await syncInit())));
      return; // up to date
    }

    const compareResults = await compare(connection, { base: localHeadRefId, head: remoteHeadRefId });
    console.log(compareResults);

    const fsDb = await fsInit();

    // TODO pattern match so iterate only once
    const patchedFiles = await Promise.all(
      compareResults.files
        .filter((file) => file.filename.startsWith("notes/"))
        .filter((file) => file.status !== "removed")
        .map((file) => ({
          path: file.filename,
          sha: file.sha,
          localContent:
            fsDb.selectObject<{ path: string; content: string }>(SELECT_FILE, {
              ":path": file.filename,
            })?.content ?? "",
          patch: file.patch,
          parsedPatches: file.patch ? parsePatch(file.patch) : null,
        }))
        .map(async (change) => ({
          ...change,
          latestContent: change.parsedPatches
            ? applyPatch(change.localContent, change.parsedPatches[0])
            : b64DecodeUnicode((await getBlob(connection!, { sha: change.sha })).content),
        }))
    );

    console.log(`[pull] all patched`, patchedFiles);
    const allDeletedFiles = compareResults.files
      .filter((file) => file.filename.startsWith("notes/"))
      .filter((file) => file.status === "removed");

    const syncDb = await syncInit();

    patchedFiles.forEach((change) => {
      sync.trackRemoteChange(syncDb, change.path, change.latestContent);
      fsDb.exec(UPSERT_FILE, {
        bind: {
          ":path": change.path,
          ":type": "text/plain",
          ":content": change.latestContent,
        },
      });
      console.log("change", change.path);
      sync.trackLocalChange(syncDb, change.path, change.latestContent);
    });

    allDeletedFiles.forEach((file) => {
      sync.trackRemoteChange(syncDb, file.filename, null);
      fsDb.exec(DELETE_FILE, {
        bind: {
          ":path": file.filename,
        },
      });
      console.log("delete", file.filename);
      sync.trackLocalChange(syncDb, file.filename, null);
    });

    sync.setGithubRef(syncDb, remoteHeadRefId);

    await proxy.setStatus(formatStatus(sync.getChangedFiles(syncDb)));
  },
  testGithubConnection: asyncPipe(syncInit, sync.testConnection),
  writeFile: async (path: string, content: string) => {
    await fs.writeFile(await fsInit(), path, "text/plain", content);
    await sync.trackLocalChange(await syncInit(), path, content);
  },
};

server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");

// on start, report change status
syncInit().then((db) => proxy.setStatus(formatStatus(sync.getChangedFiles(db))));
