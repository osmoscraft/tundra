/// <reference lib="WebWorker" />

import { ProxyServer, RequestHandler } from "../lib/worker-ipc/proxy-server";
import { CreateNodeInput, CreateNodeOutput, handleCreateNode } from "./routes/create-node";
import { GetNodesInput, GetNodesOutput, handleGetNodes } from "./routes/get-nodes";
import { handleParseDocumentHtml, ParseDocumentHtmlInput, ParseDocumentHtmlOutput } from "./routes/parse-docoument-html";
import { tempRepoName } from "./services/config";
import { FileSystem } from "./services/file-system";
import { VersionControl } from "./services/version-control";

declare const self: SharedWorkerGlobalScope;

export type ProxySchema = {
  "parse-document-html": RequestHandler<ParseDocumentHtmlInput, ParseDocumentHtmlOutput>;
  "create-node": RequestHandler<CreateNodeInput, CreateNodeOutput>;
  "get-nodes": RequestHandler<GetNodesInput, GetNodesOutput>;
};

export interface ProxyServerContext {
  fileSystem: FileSystem;
  versionControl: VersionControl;
}

async function main() {
  const fileSystem = new FileSystem();
  const versionControl = new VersionControl(fileSystem);

  fileSystem.ensureRepo(tempRepoName);

  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    const proxyServer = new ProxyServer<ProxySchema, ProxyServerContext>(port, {
      onGetContext: async () => ({
        fileSystem,
        versionControl,
      }),
    });

    proxyServer.onRequest("get-nodes", handleGetNodes);
    proxyServer.onRequest("parse-document-html", handleParseDocumentHtml);
    proxyServer.onRequest("create-node", handleCreateNode);

    port.start();
  });
}

main();
