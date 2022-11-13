import type { AppRoutes } from "./routes";
import { WorkerServer } from "./utils/worker-rpc";

declare const self: SharedWorkerGlobalScope | DedicatedWorkerGlobalScope;

console.log("[worker] online");

async function main() {
  const proxy = new WorkerServer<AppRoutes>(self);

  proxy.onRequest("echo", async ({ req }) => ({ message: req.message }));
  proxy.start();
}

main();

export default self;
