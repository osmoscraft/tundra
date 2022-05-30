/// <reference lib="WebWorker" />

import type { RequestRoutes } from "../interface/routes";
import { WorkerServer } from "../ipc/server";
import { handleParseDocumentHtml } from "./routes/parse-docoument-html";

declare const self: SharedWorkerGlobalScope;

async function main() {
  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    const workerServer = new WorkerServer<RequestRoutes>(port);

    workerServer.onRequest("parse-document-html", handleParseDocumentHtml);

    port.start();
  });
}

main();
