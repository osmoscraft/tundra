/// <reference lib="WebWorker" />

import LightningFS from "@isomorphic-git/lightning-fs";
import { ProxyServer, RequestHandler } from "../lib/worker-ipc/proxy-server";
import { CreateNodeInput, CreateNodeOutput, handleCreateNode } from "./routes/create-node";
import { GetNodesInput, GetNodesOutput, handleGetNodes } from "./routes/get-nodes";
import { handleParseDocumentHtml, ParseDocumentHtmlInput, ParseDocumentHtmlOutput } from "./routes/parse-docoument-html";
import { tempRepoName } from "./services/config";
import { FileSystem } from "./services/file-system";
import { Graph } from "./services/graph";
import { ObservableFileSystem } from "./services/observable-file-system";
import { VersionControl } from "./services/version-control";

declare const self: SharedWorkerGlobalScope;

export type ProxySchema = {
  "parse-document-html": RequestHandler<ParseDocumentHtmlInput, ParseDocumentHtmlOutput>;
  "create-node": RequestHandler<CreateNodeInput, CreateNodeOutput>;
  "get-nodes": RequestHandler<GetNodesInput, GetNodesOutput>;
};

export interface ProxyServerContextV2 {
  ofs: ObservableFileSystem;
  graph: Graph;
}

async function main2() {
  const graph = new Graph({});
  const ofs = new ObservableFileSystem({
    fsp: new LightningFS().promises,
    onChange: (record) => {
      // map fs change to graph operation
      switch (record.action) {
        case "writeFile":
          graph.writeNode();
      }
    },
  });

  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    const proxyServer = new ProxyServer<ProxySchema, ProxyServerContextV2>(port, {
      onGetContext: async () => ({
        ofs,
        graph,
      }),
    });

    proxyServer.onRequest("get-nodes", handleGetNodes);
    proxyServer.onRequest("parse-document-html", handleParseDocumentHtml);
    proxyServer.onRequest("create-node", handleCreateNode);

    port.start();
  });
}

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
    // TODO investigate how to port.close() and prevent mem leak
  });
}

main();

export default self;
