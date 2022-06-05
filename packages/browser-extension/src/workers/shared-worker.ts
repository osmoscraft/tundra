/// <reference lib="WebWorker" />

import LightningFS from "@isomorphic-git/lightning-fs";
import { getRequestHandler } from "./lib/message";
import type { CreateNodeInput, CreateNodeOutput } from "./routes/create-node";
import type { GetNodesInput, GetNodesOutput } from "./routes/get-nodes";
import type { ParseDocumentHtmlInput, ParseDocumentHtmlOutput } from "./routes/parse-docoument-html";
import { Graph, RequestWriteDetails } from "./services/graph";
import { ChangeDetails, ObservableFileSystem } from "./services/observable-file-system";

declare const self: SharedWorkerGlobalScope;

export type MessageSchema = {
  "parse-document-html": [ParseDocumentHtmlInput, ParseDocumentHtmlOutput];
  "create-node": [CreateNodeInput, CreateNodeOutput];
  "get-nodes": [GetNodesInput, GetNodesOutput];
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

  const handleGetNodes = getRequestHandler<MessageSchema, "get-nodes">(async () => {
    return {
      nodes: [],
    };
  });

  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    port.addEventListener("message", async (message) => {
      const { type, data } = message;

      switch (type as keyof MessageSchema) {
        case "get-nodes":
          const response = await handleGetNodes(data);
          port.postMessage(response);
          break;
      }
    });

    port.start();
  });
}

main();

export default self;
