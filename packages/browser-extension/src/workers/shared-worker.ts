/// <reference lib="WebWorker" />

import LightningFS from "@isomorphic-git/lightning-fs";
import { ProxyServer, RequestHandler } from "../lib/worker-ipc/proxy-server";
import type { CreateNodeInput, CreateNodeOutput } from "./routes/create-node";
import type { GetNodesInput, GetNodesOutput } from "./routes/get-nodes";
import type { ParseDocumentHtmlInput, ParseDocumentHtmlOutput } from "./routes/parse-docoument-html";
import { Graph, GraphNode, RequestWriteDetails } from "./services/graph";
import { ChangeDetails, ObservableFileSystem } from "./services/observable-file-system";

declare const self: SharedWorkerGlobalScope;

export type ProxySchema = {
  "parse-document-html": RequestHandler<ParseDocumentHtmlInput, ParseDocumentHtmlOutput>;
  "create-node": RequestHandler<CreateNodeInput, CreateNodeOutput>;
  "get-nodes": RequestHandler<GetNodesInput, GetNodesOutput>;
};

async function main() {
  const graph = new Graph({});
  const ofs = new ObservableFileSystem({
    fsp: new LightningFS().promises,
  });

  graph.addEventListener("request-write", (e) => {
    const requestDetails = (e as CustomEvent<RequestWriteDetails>).detail;
    const filePath = requestDetails.id + ".json";
    const content = requestDetails.content;
    ofs.writeFile(filePath, content);
  });

  ofs.addEventListener("change", (e) => {
    const changeRecord = (e as CustomEvent<ChangeDetails>).detail;
    switch (changeRecord.action) {
      case "writeFile":
        const [id, content] = changeRecord.args;
        graph.writeNode(parseNode(id, content as string));
        break;
    }
  });

  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    const proxyServer = new ProxyServer<ProxySchema>(port);

    proxyServer.onRequest("get-nodes", async ({ input }) => ({
      nodes: [],
    }));

    proxyServer.onRequest("create-node", async ({ input }) => {
      return { id: "123" };
    });

    port.start();
  });
}

function parseNode(id: string, content: string): GraphNode {
  return {
    id,
    title: "Mock",
    url: "https://bing.com",
  };
}

main();

export default self;
