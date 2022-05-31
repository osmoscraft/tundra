/// <reference lib="WebWorker" />

import { ProxyServer, RequestHandler } from "../lib/worker-ipc/proxy-server";
import { CreateNodeInput, CreateNodeOutput, handleCreateNode } from "./routes/create-node";
import { handleParseDocumentHtml, ParseDocumentHtmlInput, ParseDocumentHtmlOutput } from "./routes/parse-docoument-html";

declare const self: SharedWorkerGlobalScope;

export type ProxySchema = {
  "parse-document-html": RequestHandler<ParseDocumentHtmlInput, ParseDocumentHtmlOutput>;
  "create-node": RequestHandler<CreateNodeInput, CreateNodeOutput>;
};

async function main() {
  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    const proxyServer = new ProxyServer<ProxySchema>(port);

    proxyServer.onRequest("parse-document-html", handleParseDocumentHtml);
    proxyServer.onRequest("create-node", handleCreateNode);

    port.start();
  });
}

main();
