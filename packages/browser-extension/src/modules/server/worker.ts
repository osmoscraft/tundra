/// <reference lib="WebWorker" />

import { WorkerServer } from "../ipc/server";

const broadcastChannel = new BroadcastChannel("shared-channel");

declare const self: SharedWorkerGlobalScope;

async function main() {
  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    const workerServer = new WorkerServer(port);

    workerServer.onRequest("parse-document-html", async () => {
      return "parse page mock result";
    });

    port.start();
  });
}

main();
