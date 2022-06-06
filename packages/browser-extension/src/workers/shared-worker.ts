/// <reference lib="WebWorker" />

import LightningFS from "@isomorphic-git/lightning-fs";
import type { AppRoutes, CreateNodeInput, CreateNodeOutput, GetNodesInput, GetNodesOutput } from "../lib/app-routes";
import { ProxyServer, RouteHandler } from "../lib/messaging/proxy-server";
import { Graph, RequestWriteDetails } from "./services/graph";
import { ChangeDetails, ObservableFileSystem } from "./services/observable-file-system";

declare const self: SharedWorkerGlobalScope;

async function main() {
  const graph = new Graph({});
  const fs = new ObservableFileSystem({
    fsp: new LightningFS().promises,
  });
  const proxy = new ProxyServer<AppRoutes>();

  const handleGraphRequestWrite: EventListener = (e) => {
    const requestDetails = (e as CustomEvent<RequestWriteDetails>).detail;
    const filePath = requestDetails.id + ".json";
    const content = requestDetails.content;
    fs.writeFile(filePath, content);
  };

  const handleFileSystemChange: EventListener = (e) => {
    const changeRecord = (e as CustomEvent<ChangeDetails>).detail;
    switch (changeRecord.action) {
      case "writeFile":
        const [id, content] = changeRecord.args;
        graph.writeNode(graph.parseNode(id, content as string));
        break;
    }
  };

  const handleCreateNode: RouteHandler<CreateNodeInput, CreateNodeOutput> = async ({ input }) => {
    const id = crypto.randomUUID(); // TODO use real id generator

    return {
      id,
    };
  };

  const handleGetNodes: RouteHandler<GetNodesInput, GetNodesOutput> = async ({ input }) => {
    return {
      nodes: [],
    };
  };

  graph.addEventListener("request-write", handleGraphRequestWrite);
  fs.addEventListener("change", handleFileSystemChange);

  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    proxy.onRequest(port, "create-node", handleCreateNode);
    proxy.onRequest(port, "get-nodes", handleGetNodes);

    port.start();
  });
}

main();

export default self;
