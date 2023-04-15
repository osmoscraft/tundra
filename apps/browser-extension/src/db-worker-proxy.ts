import { notify, request, respond } from "./modules/rpc/notify";
import type { MessageToDbWorker, MessageToMain } from "./typings/messages";

let instancePromise: Promise<Worker>;
function getDbWorker() {
  instancePromise ??= new Promise<Worker>((resolve) => {
    performance.mark("db-worker-load-start");
    const worker = new Worker("./db-worker.js", { type: "module" });

    const handleDbReady = (event: MessageEvent<MessageToMain>) => {
      if (event.data.notifyDbReady) {
        resolve(worker);
        worker.removeEventListener("message", handleDbReady);
        console.log(`[perf] DB worker spawn: ${performance.measure("", "db-worker-load-start").duration.toFixed(2)}ms`);
      }
    };

    worker.addEventListener("message", handleDbReady);
  });
  return instancePromise;
}

export interface DbWorkerProxy {
  notify: (message: MessageToDbWorker) => any;
  request: (request: MessageToDbWorker) => Promise<MessageToMain>;
  respond: (request: MessageToMain, response: MessageToDbWorker) => any;
}

export function preloadDbWorker() {
  getDbWorker();
}

export function getDbWorkerProxy(): DbWorkerProxy {
  return {
    notify: (message) => getDbWorker().then((worker) => notify(worker, message)),
    request: (req) => getDbWorker().then((worker) => request(worker, req)),
    respond: (req, res) => getDbWorker().then((worker) => respond(worker, req, res)),
  };
}
