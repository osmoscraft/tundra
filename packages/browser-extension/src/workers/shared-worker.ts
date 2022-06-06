/// <reference lib="WebWorker" />

import LightningFS from "@isomorphic-git/lightning-fs";
import type { AppRoutes, CreateNodeInput, CreateNodeOutput, GetNodesInput, GetNodesOutput } from "./app-routes";
import { ensureDir, readFilesInDir } from "./lib/fs";
import { ensureRepo } from "./lib/git";
import { ProxyServer, RouteHandler } from "./lib/messaging/proxy-server";
import git from "./vendor/isomorphic-git/index.umd.min";

declare const self: SharedWorkerGlobalScope;

async function main() {
  const fs = new LightningFS("tinykb-fs").promises;
  const proxy = new ProxyServer<AppRoutes>();

  const initialiized = (async () => {
    await ensureDir(fs, "/repos/repo-01");
    await ensureRepo({ fs, git, dir: "/repos/repo-01" });
  })();

  self.addEventListener("connect", async (connectEvent) => {
    const port = connectEvent.ports[0];

    proxy.onRequest(port, "create-node", handleCreateNode);
    proxy.onRequest(port, "get-nodes", handleGetNodes);
    proxy.onRequest(port, "get-status", handleGetStatus);

    port.start();
  });

  const handleCreateNode: RouteHandler<CreateNodeInput, CreateNodeOutput> = async ({ input }) => {
    await initialiized;
    await fs.writeFile(`/repos/repo-01/${input.id}.json`, input.content);

    return {
      id: input.id,
    };
  };

  const handleGetNodes: RouteHandler<GetNodesInput, GetNodesOutput> = async ({ input }) => {
    await initialiized;
    const files = await readFilesInDir(fs, `/repos/repo-01`);
    const nodes = files.map((file) => JSON.parse(file as string));

    return {
      nodes,
    };
  };

  const handleGetStatus: RouteHandler<undefined, any> = async ({ input }) => {
    const status = await git.statusMatrix({
      fs: { promises: fs },
      dir: `/repos/repo-01`,
    });

    return status;
  };
}

main();

export default self;
