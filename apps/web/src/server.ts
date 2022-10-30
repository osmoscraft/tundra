/// <reference lib="WebWorker" />

importScripts("/vendor/index.umd.min.js");

import type { AppRoutes } from "./routes";
import { dbAsync, getRemote, setRemote } from "./server/db";
import { clone, testConnection } from "./server/sync";
import { ProxyServer } from "./utils";

declare const self: SharedWorkerGlobalScope | DedicatedWorkerGlobalScope;

console.log(git);
console.log("MAGICSTRING");

console.log("[worker] online");

async function main() {
  const proxy = new ProxyServer<AppRoutes>(self);

  proxy.onRequest("echo", async ({ req }) => ({ message: req.message }));
  proxy.onRequest("getRemote", async () => await getRemote(await dbAsync));
  proxy.onRequest("setRemote", async ({ req }) => void (await setRemote(await dbAsync, req)));
  proxy.onRequest("testRemote", async ({ req }) => await testConnection(req.connection));
  proxy.onRequest("gitClone", async () => await clone((await getRemote(await dbAsync))!));

  proxy.start();
}

main();

export default self;
