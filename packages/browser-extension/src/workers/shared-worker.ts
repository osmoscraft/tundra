/// <reference lib="WebWorker" />

import LightningFS from "@isomorphic-git/lightning-fs";
import type { AppRoutes } from "./app-routes";
import { ensureDir, readFilesInDir } from "./lib/fs";
import { ensureRepo } from "./lib/git";
import { ProxyServer } from "./lib/messaging/proxy-server";
import git from "./vendor/isomorphic-git/index.umd.min";

declare const self: SharedWorkerGlobalScope | DedicatedWorkerGlobalScope;

console.log("[worker] online");

async function main() {
  const fs = new LightningFS("tinykb-fs");
  const fsp = fs.promises;
  const proxy = new ProxyServer<AppRoutes>(self);

  const initialiized = (async () => {
    await ensureDir(fsp, "/repos/repo-01");
    await ensureRepo({ fs, git, dir: "/repos/repo-01" });
  })();

  proxy.onRequest("create-node", async ({ input }) => {
    await initialiized;
    await fsp.writeFile(`/repos/repo-01/${input.id}.json`, input.content);

    return {
      id: input.id,
    };
  });

  proxy.onRequest("get-nodes", async ({ input }) => {
    await initialiized;
    const files = await readFilesInDir(fsp, `/repos/repo-01`);
    const nodes = files.map((file) => JSON.parse(file as string));

    return {
      nodes,
    };
  });

  proxy.onRequest("get-status", async ({ input }) => {
    const status = await git.statusMatrix({
      fs,
      dir: `/repos/repo-01`,
    });

    return status;
  });

  proxy.start();
}

main();

export default self;
