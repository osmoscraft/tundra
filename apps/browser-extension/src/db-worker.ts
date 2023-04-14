import type { DbWorkerContext } from "./modules/db/handlers/base";
import { handleDbDestory } from "./modules/db/handlers/db-destory";
import { handleRequestDbDownload } from "./modules/db/handlers/db-download";
import { dbInit } from "./modules/db/handlers/db-init";
import { handleGithubImport } from "./modules/db/handlers/github-import";
import { handleRequestTestConnection } from "./modules/db/handlers/test-connection";
import { notify, request, respond } from "./modules/rpc/notify";
import type { MessageToDbWorker } from "./typings/messages";

declare const self: DedicatedWorkerGlobalScope;

export const DB_FILENAME = "tinykb.sqlite3";

const context: DbWorkerContext = {
  dbFilename: DB_FILENAME,
  dbPromise: dbInit(`/${DB_FILENAME}`),
  notify: notify.bind(null, self),
  request: (req) => request(self, req),
  respond: respond.bind(null, self),
};

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
