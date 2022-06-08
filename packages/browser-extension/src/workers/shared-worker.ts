/// <reference lib="WebWorker" />

import LightningFS from "@isomorphic-git/lightning-fs";
import type { AppRoutes, RepoNode, WorkspaceNode } from "./app-routes";
import { ensureDir } from "./lib/fs";
import { ensureRepo, GitAuthor } from "./lib/git";
import { ProxyServer } from "./lib/messaging/proxy-server";
import git from "./vendor/isomorphic-git/index.umd.min";

declare const self: SharedWorkerGlobalScope | DedicatedWorkerGlobalScope;

console.log("[worker] online");

async function main() {
  const fs = new LightningFS("tinykb-fs");
  const fsp = fs.promises;
  const proxy = new ProxyServer<AppRoutes>(self);
  const author: GitAuthor = { name: "tinykb" };

  proxy.onRequest("workspace/create-node", async ({ input }) => {
    await ensureDir({ fs: fsp, dir: "/workspace" });
    await fsp.writeFile(`/workspace/${input.id}.json`, input.content);

    return {
      id: input.id,
    };
  });

  proxy.onRequest("workspace/list-all", async () => {
    // TODO query from index instead
    await ensureDir({ fs: fsp, dir: "/workspace" });
    const nodeFiles = await fsp.readdir("/workspace");
    const contentList = (await Promise.all(nodeFiles.map((file) => fsp.readFile(`/workspace/${file}`, { encoding: "utf8" })))) as string[];
    const nodes: WorkspaceNode[] = contentList.map((content, index) => ({
      id: nodeFiles[index].split(".")[0],
      content,
    }));

    return {
      nodes,
    };
  });

  proxy.onRequest("workspace/commit-all", async () => {
    // TODO investigate error recovery
    await ensureDir({ fs: fsp, dir: "/workspace" });
    await ensureRepo({ git, fs, dir: "/repos/default", author });
    const workspaceFiles = await fsp.readdir("/workspace");
    const contentList = (await Promise.all(workspaceFiles.map((file) => fsp.readFile(`/workspace/${file}`, { encoding: "utf8" })))) as string[];
    await Promise.all(contentList.map((content, index) => fsp.writeFile(`/repos/default/${workspaceFiles[index]}`, content)));
    await Promise.all(workspaceFiles.map((filepath) => git.add({ fs, dir: "/repos/default", filepath })));
    await git.commit({ fs, dir: "/repos/default", message: "", author });

    await Promise.all(workspaceFiles.map((file) => fsp.unlink(`/workspace/${file}`)));

    return {
      changeCount: workspaceFiles.length,
    };
  });

  proxy.onRequest("repo/list-all", async () => {
    await ensureRepo({ git, fs, dir: "/repos/default", author });

    const statusMatrix = await git.statusMatrix({ fs, dir: "/repos/default" });
    const contentList = (await Promise.all(statusMatrix.map((status) => fsp.readFile(`/repos/default/${status[0]}`, { encoding: "utf8" })))) as string[];

    const nodes: RepoNode[] = contentList.map((content, index) => ({
      id: statusMatrix[index][0],
      content,
    }));

    return { nodes };
  });

  proxy.start();
}

main();

export default self;
