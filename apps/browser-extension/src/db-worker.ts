import type { DbWorkerContext } from "./modules/db/handlers/base";
import { handleDbDestory } from "./modules/db/handlers/destory";
import { handleRequestDownload } from "./modules/db/handlers/download";
import { initDb } from "./modules/db/handlers/init";
import { notify, request, respond } from "./modules/rpc/notify";
import type { MessageToDbWorker } from "./typings/messages";

declare const self: DedicatedWorkerGlobalScope;

export const DB_FILENAME = "tinykb.sqlite3";

const context: DbWorkerContext = {
  dbFilename: DB_FILENAME,
  dbPromise: initDb(`/${DB_FILENAME}`),
  notify: notify.bind(null, self),
  request: (req) => request(self, req),
  respond: respond.bind(null, self),
};

const onWorkerMessage = (event: MessageEvent<MessageToDbWorker>) => {
  const message = event.data;
  console.log(`[worker] received`, message);

  handleDbDestory(context, message);
  handleRequestDownload(context, message);
};

self.addEventListener("message", onWorkerMessage);

context.notify({ notifyDbReady: true });
