import { FileService } from "./modules/fs";
import { notify, request, respond } from "./modules/rpc/notify";
import { SyncService } from "./modules/sync";
import type { DbWorkerContext } from "./modules/worker/handlers/base";
import { handleNotifyGithubConnection } from "./modules/worker/handlers/handle-notify-github-connection";
import { handleDbClear } from "./modules/worker/handlers/handle-request-db-clear";
import { handleDbDestory } from "./modules/worker/handlers/handle-request-db-destory";
import { handleRequestDbExport } from "./modules/worker/handlers/handle-request-db-export";
import { handleRequestGithubConnection } from "./modules/worker/handlers/handle-request-github-connection";
import { handleRequestGithubImport } from "./modules/worker/handlers/handle-request-github-import";
import { handleRequestTestConnection } from "./modules/worker/handlers/handle-request-test-connection";
import type { MessageToDbWorker } from "./typings/messages";

export type DbWorkerEventHandler = (context: DbWorkerContext, e: Event) => any;

declare const self: DedicatedWorkerGlobalScope;

const FS_DB_FILENAME = "tinyfs.sqlite3";
const SYNC_DB_FILENAME = "tinysync.sqlite3";

const context: DbWorkerContext = {
  fileService: new FileService(`/${FS_DB_FILENAME}`),
  syncService: new SyncService(`/${SYNC_DB_FILENAME}`),
  notify: notify.bind(null, self),
  request: (req) => request(self, req),
  respond: respond.bind(null, self),
};

const onWorkerMessage = (event: MessageEvent<MessageToDbWorker>) => {
  const message = event.data;
  console.log(`[worker] received`, message);

  handleDbClear(context, message);
  handleDbDestory(context, message);
  handleNotifyGithubConnection(context, message);
  handleRequestDbExport(context, message);
  handleRequestGithubConnection(context, message);
  handleRequestGithubImport(context, message);
  handleRequestTestConnection(context, message);
};

self.addEventListener("message", onWorkerMessage);

context.notify({ notifyWorkerReady: true });
