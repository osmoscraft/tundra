import { FileService } from "./modules/fs";
import { GraphService } from "./modules/graph";
import { notify, request, respond } from "./modules/rpc/notify";
import { SyncService } from "./modules/sync";
import type { DbWorkerContext, DbWorkerHandler } from "./modules/worker/handlers/base";
import { handleNotifyGithubConnection } from "./modules/worker/handlers/handle-notify-github-connection";
import { handleRequestDbClear } from "./modules/worker/handlers/handle-request-db-clear";
import { handleRequestDbDestory } from "./modules/worker/handlers/handle-request-db-destory";
import { handleRequestDbExport } from "./modules/worker/handlers/handle-request-db-export";
import { handleRequestFileByPath } from "./modules/worker/handlers/handle-request-file-by-path";
import { handleRequestFileList } from "./modules/worker/handlers/handle-request-file-list";
import { handleRequestGithubConnection } from "./modules/worker/handlers/handle-request-github-connection";
import { handleRequestGithubImport } from "./modules/worker/handlers/handle-request-github-import";
import { handleRequestTestConnection } from "./modules/worker/handlers/handle-request-test-connection";
import type { MessageToDbWorker } from "./typings/messages";

export type DbWorkerEventHandler = (context: DbWorkerContext, e: Event) => any;

declare const self: DedicatedWorkerGlobalScope;

const FS_DB_FILENAME = "tinyfs.sqlite3";
const SYNC_DB_FILENAME = "tinysync.sqlite3";
const GRAPH_DB_FILENAME = "tinygraph.sqlite3";

const context: DbWorkerContext = {
  fileService: new FileService(`/${FS_DB_FILENAME}`),
  graphSerivce: new GraphService(`/$${GRAPH_DB_FILENAME}`),
  syncService: new SyncService(`/${SYNC_DB_FILENAME}`),
  notify: notify.bind(null, self),
  request: (req) => request(self, req),
  respond: respond.bind(null, self),
};

const handlers: Record<string, DbWorkerHandler> = {
  handleRequestDbClear,
  handleRequestDbDestory,
  handleNotifyGithubConnection,
  handleRequestDbExport,
  handleRequestFileList,
  handleRequestFileByPath,
  handleRequestGithubConnection,
  handleRequestGithubImport,
  handleRequestTestConnection,
};

const messageNameToHandlerName = (text: string) => `handle${text[0].toUpperCase()}${text.slice(1)}`;

const onWorkerMessage = (event: MessageEvent<MessageToDbWorker>) => {
  const message = event.data;
  console.log(`[worker] received`, message);
  Object.keys(message)
    .filter((key) => key.match(/^(request)|(respond)|(notify)/))
    .map(messageNameToHandlerName)
    .map((handlerName) => handlers[handlerName]?.(context, message));
};

context.fileService.addEventListener("prewrite", (e) => {});
context.fileService.addEventListener("postwrite", (e) => {});

self.addEventListener("message", onWorkerMessage);

context.notify({ notifyWorkerReady: true });
