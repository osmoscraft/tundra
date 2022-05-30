/// <reference lib="WebWorker" />

import { WorkerServer } from "../ipc/server";

declare const self: SharedWorkerGlobalScope;

export type Routes = {
  "test-route": [void, void];
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

    const workerServer = new WorkerServer(port);

    workerServer.onRequest("parse-document-html", async () => {
      return "parse page mock result";
    });

    port.start();
  });
}

main();
