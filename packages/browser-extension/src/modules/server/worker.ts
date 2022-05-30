/// <reference lib="WebWorker" />

import { WorkerServer } from "../lib/ipc/server";
import { handleParseDocumentHtml } from "./routes/parse-docoument-html";

declare const self: SharedWorkerGlobalScope;

async function main() {
  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    const workerServer = new WorkerServer(port);

    workerServer.onRequest("parse-document-html", handleParseDocumentHtml);

    port.start();
  });
}

main();
