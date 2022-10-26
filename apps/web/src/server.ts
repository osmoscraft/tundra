/// <reference lib="WebWorker" />

import type { AppRoutes } from "./routes";
import { ProxyServer } from "./utils";

declare const self: SharedWorkerGlobalScope | DedicatedWorkerGlobalScope;

console.log("[worker] online");

async function main() {
  const proxy = new ProxyServer<AppRoutes>(self);

  // TODO validate workspace on start
  // TODO make sure client waits for server start before starting query
  proxy.onRequest("echo", async ({ req }) => {
    return {
      message: req.message,
    };
  });

  proxy.start();
}

main();

export default self;
