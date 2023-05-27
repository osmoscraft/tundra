import { asyncPipe, mapAsyncGeneratorParallel, tap } from "@tinykb/fp-utils";
import { client, dedicatedWorkerPort, server } from "@tinykb/rpc-utils";
import { destoryOpfsByPath, getOpfsFileByPath } from "@tinykb/sqlite-utils";
import * as fs from "../modules/file-system";
import * as graph from "../modules/graph";
import type { GithubConnection } from "../modules/sync";
import * as sync from "../modules/sync";
import { ChangeType, updateContentBulk } from "../modules/sync/github/operations/update-content-bulk";
import { ensurePushParameters, fileChangeToBulkFileChangeItem } from "../modules/sync/push";
import { formatStatus } from "../modules/sync/status";
import type { NotebookRoutes } from "../pages/notebook";

export type DataWorkerRoutes = typeof routes;

const FS_DB_PATH = "/tinykb-fs.sqlite3";
const SYNC_DB_PATH = "/tinykb-sync.sqlite3";
const GRAPH_DB_PATH = "/tinykb-graph.sqlite3";
const fsInit = fs.init.bind(null, FS_DB_PATH);
const syncInit = sync.init.bind(null, SYNC_DB_PATH);
const graphInit = graph.init.bind(null, GRAPH_DB_PATH);

const { proxy } = client<NotebookRoutes>({ port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

const routes = {
  checkHealth: asyncPipe(
    tap(() => console.log("check fs")),
    fs.checkHealth,
    tap(() => console.log("check sync")),
    sync.checkHealth,
    tap(() => console.log("check graph")),
    graph.checkHealth
  ),
  clearFiles: async () =>
    Promise.all([fs.clear(await fsInit()), sync.clearHistory(await syncInit()), graph.clear(await graphInit())]),
  fetchGithub: async () => {
    const syncDb = await syncInit();
    const { generator } = await sync.getGitHubRemoteChanges(syncDb);
    await mapAsyncGeneratorParallel(
      async (item) => sync.trackRemoteChange(syncDb, item.path, await item.readText(), await item.readTimestamp()),
      generator
    );

    await proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));
  },
  getFile: async (path: string) => fs.readFile(await fsInit(), path),
  getFsDbFile: getOpfsFileByPath.bind(null, FS_DB_PATH),
  getGithubConnection: asyncPipe(syncInit, sync.getConnection),
  getGraphDbFile: getOpfsFileByPath.bind(null, GRAPH_DB_PATH),
  getSyncDbFile: getOpfsFileByPath.bind(null, SYNC_DB_PATH),
  importGitHubRepo: async () => {
    const fsDb = await fsInit();
    const syncDb = await syncInit();
    const graphDb = await graphInit();
    await Promise.all([fs.clear(fsDb), sync.clearHistory(syncDb)]);

    const { generator, oid } = await sync.getGitHubRemote(syncDb);

    await mapAsyncGeneratorParallel(async (item) => {
      const content = item.readText() as string;
      await sync.trackRemoteChangeNow(syncDb, item.path, content);
      await fs.writeFile(fsDb, item.path, "text/markdown", content!);
      await sync.trackLocalChangeNow(syncDb, item.path, content);
      await graph.updateNodeByPath(graphDb, fsDb, item.path);
    }, generator);

    sync.setGithubRef(syncDb, oid);
  },
  listFiles: async () => fs.listFiles(await fsInit(), 10, 0),
  pullGitHub: async () => {
    const fsDb = await fsInit();
    const syncDb = await syncInit();
    const graphDb = await graphInit();
    const { generator, remoteHeadRefId } = await sync.getGitHubRemoteChanges(syncDb);

    await mapAsyncGeneratorParallel(async (item) => {
      const newContent = await item.readText();
      await sync.trackRemoteChange(syncDb, item.path, newContent, await item.readTimestamp());
      const fileChange = sync.getRemoteFileChange(syncDb, item.path);
      if (fileChange) {
        await fs.writeOrDeleteFile(fsDb, item.path, "text/markdown", newContent);
        await sync.trackLocalChangeNow(syncDb, item.path, newContent);
        await graph.updateNodeByPath(graphDb, fsDb, item.path);
      }
    }, generator);

    await proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));

    sync.setGithubRef(syncDb, remoteHeadRefId);
    await proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));
  },
  pushGitHub: async () => {
    const syncDb = await syncInit();
    const fsDb = await fsInit();
    const { connection } = ensurePushParameters(syncDb);
    const localFileChanges = sync.getLocalFileChanges(syncDb);
    const fileChanges = localFileChanges.map(fileChangeToBulkFileChangeItem.bind(null, fsDb));
    const pushResult = await updateContentBulk(connection, fileChanges);

    await Promise.all(
      fileChanges.map((file) =>
        sync.trackRemoteChangeNow(syncDb, file.path, file.changeType === ChangeType.Remove ? null : file.content)
      )
    );

    sync.setGithubRef(syncDb, pushResult.commitSha);
    await proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));
  },
  rebuild: () =>
    Promise.all([destoryOpfsByPath(FS_DB_PATH), destoryOpfsByPath(SYNC_DB_PATH), destoryOpfsByPath(GRAPH_DB_PATH)]),
  searchNodes: async (query: string) => {
    const graphDb = await graphInit();
    return graph.searchNode(graphDb, query);
  },
  setGithubConnection: async (connection: GithubConnection) => sync.setConnection(await syncInit(), connection),
  testGithubConnection: asyncPipe(syncInit, sync.testConnection),
  writeFile: async (path: string, content: string) => {
    const syncDb = await syncInit();
    const fsDb = await fsInit();
    const graphDb = await graphInit();

    await fs.writeFile(await fsInit(), path, "text/markdown", content);
    await sync.trackLocalChangeNow(await syncInit(), path, content);
    await graph.updateNodeByPath(graphDb, fsDb, path);

    await proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));
  },
};

server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

(async function init() {
  const syncDb = await syncInit();
  const fsDb = await fsInit();
  const graphDb = await graphInit();

  // on start, index graph
  graph.updateAllNodes(graphDb, fsDb);

  // on start, report change status
  proxy.setStatus(formatStatus(sync.getFileChanges(syncDb)));

  console.log("[data worker] initialized");
})();
