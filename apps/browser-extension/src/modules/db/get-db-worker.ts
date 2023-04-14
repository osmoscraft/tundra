import type { MessageToMain } from "../../typings/messages";

let instancePromise: Promise<Worker>;
export function getDbWorker() {
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
