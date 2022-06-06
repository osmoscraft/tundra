/// <reference lib="WebWorker" />

import LightningFS from "@isomorphic-git/lightning-fs";
import type { AppRoutes, CreateNodeInput, CreateNodeOutput, GetNodesInput, GetNodesOutput } from "../lib/app-routes";
import { ProxyServer, RouteHandler } from "../lib/messaging/proxy-server";
import { ensureDir, readFilesInDir } from "./lib/fs";

declare const self: SharedWorkerGlobalScope;

async function main() {
  const fs = new LightningFS().promises;
  fs.init("tinykb-fs");

  const proxy = new ProxyServer<AppRoutes>();

  self.addEventListener("connect", (connectEvent) => {
    const port = connectEvent.ports[0];

    proxy.onRequest(port, "create-node", handleCreateNode);
    proxy.onRequest(port, "get-nodes", handleGetNodes);

    port.start();
  });

  const handleCreateNode: RouteHandler<CreateNodeInput, CreateNodeOutput> = async ({ input }) => {
    await ensureDir(fs, "/repos/repo-01");
    await fs.writeFile(`/repos/repo-01/${input.id}.json`, input.content);

    return {
      id: input.id,
    };
  };

  const handleGetNodes: RouteHandler<GetNodesInput, GetNodesOutput> = async ({ input }) => {
    const files = await readFilesInDir(fs, `/repos/repo-01`);
    const nodes = files.map((file) => JSON.parse(file as string));

    return {
      nodes,
    };
  };
}

main();

export default self;
