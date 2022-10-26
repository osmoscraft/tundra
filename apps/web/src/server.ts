/// <reference lib="WebWorker" />

import type { AppRoutes } from "./routes";
import { dbAsync, getRemote, setRemote } from "./server/db";
import { testConnection } from "./server/sync";
import { ProxyServer } from "./utils";

declare const self: SharedWorkerGlobalScope | DedicatedWorkerGlobalScope;

console.log("[worker] online");

async function main() {
  const proxy = new ProxyServer<AppRoutes>(self);

  proxy.onRequest("echo", async ({ req }) => ({ message: req.message }));
  proxy.onRequest("getRemote", async () => await getRemote(await dbAsync));
  proxy.onRequest("setRemote", async ({ req }) => void (await setRemote(await dbAsync, req)));
  proxy.onRequest("testRemote", async ({ req }) => await testConnection(req.connection));

  proxy.start();
}

main();

export default self;
