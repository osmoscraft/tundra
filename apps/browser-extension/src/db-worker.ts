import { notify, request, respond } from "./modules/rpc/notify";
import { TinyFS } from "./modules/tiny-fs";
import type { DbWorkerContext } from "./modules/worker/handlers/base";
import { handleDbDestory } from "./modules/worker/handlers/db-destory";
import { handleRequestDbDownload } from "./modules/worker/handlers/db-download";
import { handleGithubImport } from "./modules/worker/handlers/github-import";
import { handleRequestTestConnection } from "./modules/worker/handlers/test-connection";
import type { MessageToDbWorker } from "./typings/messages";

declare const self: DedicatedWorkerGlobalScope;

const TINYFS_FILENAME = "tinyfs.sqlite3";

const context: DbWorkerContext = {
  tinyFS: new TinyFS(`/${TINYFS_FILENAME}`),
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
