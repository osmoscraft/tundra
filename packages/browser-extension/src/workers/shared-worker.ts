/// <reference lib="WebWorker" />

import LightningFS from "@isomorphic-git/lightning-fs";
import type { AppRoutes, CreateNodeInput, CreateNodeOutput, GetNodesInput, GetNodesOutput } from "../lib/app-routes";
import { ProxyServer, RouteHandler } from "../lib/messaging/proxy-server";
import { ObservableFileSystem } from "./services/observable-file-system";

declare const self: SharedWorkerGlobalScope;

async function main() {
  const fs = new ObservableFileSystem({
    fsp: new LightningFS().promises,
  });
  const proxy = new ProxyServer<AppRoutes>();

  const handleCreateNode: RouteHandler<CreateNodeInput, CreateNodeOutput> = async ({ input }) => {
    const { content } = input;
    const node = JSON.parse(content);
    // TODO write to disk

    return {
      id: node.id,
    };
  };

  const handleGetNodes: RouteHandler<GetNodesInput, GetNodesOutput> = async ({ input }) => {
    return {
      nodes: [
        {
          title: "test-1",
          id: "1",
          url: "https://bing.com",
        },
        {
          title: "test-2",
          id: "2",
          url: "https://bing.com",
        },
      ],
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
