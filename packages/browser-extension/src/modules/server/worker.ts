/// <reference lib="WebWorker" />

import { WorkerServer } from "../ipc/server";
import { handleParseDocumentHtml } from "./handlers/parse-docoument-html";

declare const self: SharedWorkerGlobalScope;

export type RequestRoutes = {
  "parse-document-html": [ParseDocumentHtmlInput, ParseDocumentHtmlOutput];
};

interface ParseDocumentHtmlInput {
  html: string;
}
interface ParseDocumentHtmlOutput {
  title: string;
}

async function main() {
  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    const workerServer = new WorkerServer<RequestRoutes>(port);

    workerServer.onRequest("parse-document-html", handleParseDocumentHtml);

    port.start();
  });
}

main();
