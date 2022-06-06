/// <reference lib="WebWorker" />

import LightningFS from "@isomorphic-git/lightning-fs";
import type { AppRoutes, CreateNodeInput, CreateNodeOutput, GetNodesInput, GetNodesOutput } from "../lib/app-routes";
import { ProxyServer, RouteHandler } from "../lib/messaging/proxy-server";
import { Graph } from "./services/graph";
import { ObservableFileSystem } from "./services/observable-file-system";

declare const self: SharedWorkerGlobalScope;

async function main() {
  const fs = new ObservableFileSystem({
    fsp: new LightningFS().promises,
  });
  fs.init("tinykb-fs");
  const graph = new Graph({ fs });
  const proxy = new ProxyServer<AppRoutes>();

  const handleCreateNode: RouteHandler<CreateNodeInput, CreateNodeOutput> = async ({ input }) => {
    const { id, content } = input;
    graph.writeNode(id, content);

    return {
      id,
    };
  };

  const handleGetNodes: RouteHandler<GetNodesInput, GetNodesOutput> = async ({ input }) => {
    const nodes = await graph.listNodes();
    return {
      nodes,
    };
  };

  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    proxy.onRequest(port, "create-node", handleCreateNode);
    proxy.onRequest(port, "get-nodes", handleGetNodes);

    port.start();
  });
}

main();

export default self;
