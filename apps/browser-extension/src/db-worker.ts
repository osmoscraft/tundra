import { FileService } from "./modules/fs";
import { notify, request, respond } from "./modules/rpc/notify";
import { SyncService } from "./modules/sync";
import type { DbWorkerContext } from "./modules/worker/handlers/base";
import { handleDbDestory } from "./modules/worker/handlers/db-destory";
import { handleRequestDbDownload } from "./modules/worker/handlers/db-download";
import { handleGithubImport } from "./modules/worker/handlers/github-import";
import { handleImportItem } from "./modules/worker/handlers/handle-import-item";
import { handleRequestTestConnection } from "./modules/worker/handlers/test-connection";
import type { MessageToDbWorker } from "./typings/messages";

export type DbWorkerEventHandler = (context: DbWorkerContext, e: Event) => any;

declare const self: DedicatedWorkerGlobalScope;

const TINYFS_FILENAME = "tinyfs.sqlite3";

const context: DbWorkerContext = {
  fileService: new FileService(`/${TINYFS_FILENAME}`),
  syncService: new SyncService(), // todo inject credentials on handler
  notify: notify.bind(null, self),
  request: (req) => request(self, req),
  respond: respond.bind(null, self),
};

context.syncService.addEventListener("importItem", handleImportItem.bind(null, context));

const onWorkerMessage = (event: MessageEvent<MessageToDbWorker>) => {
  const message = event.data;
  console.log(`[worker] received`, message);

  handleDbDestory(context, message);
  handleGithubImport(context, message);
  handleRequestDbDownload(context, message);
  handleRequestTestConnection(context, message);
};

self.addEventListener("message", onWorkerMessage);

context.notify({ notifyDbReady: true });
