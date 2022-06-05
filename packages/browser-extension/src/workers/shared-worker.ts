/// <reference lib="WebWorker" />

import LightningFS from "@isomorphic-git/lightning-fs";
import { getMessageHandler } from "./lib/message";
import type { CreateNodeInput, CreateNodeOutput } from "./routes/create-node";
import type { GetNodesOutput } from "./routes/get-nodes";
import type { ParseDocumentHtmlInput, ParseDocumentHtmlOutput } from "./routes/parse-docoument-html";
import { Graph, RequestWriteDetails } from "./services/graph";
import { ChangeDetails, ObservableFileSystem } from "./services/observable-file-system";

declare const self: SharedWorkerGlobalScope;

export type RouteSchema = {
  "parse-document-html": [ParseDocumentHtmlInput, ParseDocumentHtmlOutput];
  "create-node": [CreateNodeInput, CreateNodeOutput];
  "get-nodes": [undefined, GetNodesOutput];
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
        graph.writeNode(graph.parseNode(id, content as string));
        break;
    }
  });

  const handleGetNodes = getMessageHandler<RouteSchema, "get-nodes">(async () => {
    return {
      nodes: [
        { title: "node 1", id: "1", url: "https://www.bing.com" },
        { title: "node 2", id: "2", url: "https://www.bing.com" },
      ],
    };
  });

  const handleCreateNode = getMessageHandler<RouteSchema, "create-node">(async () => {
    return {
      id: "111",
    };
  });

  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    port.addEventListener("message", async (message) => {
      const { data } = message;

      switch (data.route as keyof RouteSchema) {
        case "get-nodes":
          return port.postMessage(await handleGetNodes(message));
        case "create-node":
          return port.postMessage(await handleCreateNode(message));
      }
    });

    port.start();
  });
}

main();

export default self;
