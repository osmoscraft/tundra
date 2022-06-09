import type { AppRoutes } from "../workers/app-routes";
import { ProxyClient } from "../workers/lib/messaging/proxy-client";
import { getCurrentTab } from "./lib/get-current-tab";

const SHARED_WORKER = false;

export default async function main() {
  const worker = SHARED_WORKER
    ? new SharedWorker("./workers/shared-worker.js", { name: "tinykb-worker" })
    : new Worker("./workers/shared-worker.js", { name: "tinykb-worker" });

  const proxy = new ProxyClient<AppRoutes>(worker);
  proxy.start();

  parse();

  window.addEventListener("click", async (e) => {
    const actionTrigger = (e.target as HTMLElement)?.closest("[data-action]");
    switch (actionTrigger?.getAttribute("data-action")) {
      case "capture":
        const content = JSON.stringify({
          title: document.querySelector<HTMLInputElement>(`[data-value="title"]`)!.value,
          url: document.querySelector<HTMLInputElement>(`[data-value="url"]`)!.value,
          timeModified: Date.now(),
        });
        await proxy.request("workspace/create-node", {
          id: crypto.randomUUID(),
          content,
        });
        break;
      case "commit":
        await proxy.request("workspace/commit-all");
    }
  });

  const workspaceNodeList = document.querySelector<HTMLUListElement>("#ws-list");
  if (!workspaceNodeList) throw new Error("Node list not found");

  const workspace = await proxy.request("workspace/list-all");
  console.log(workspace);

  workspaceNodeList.innerHTML = workspace.nodes
    .map((node) => JSON.parse(node.content))
    .map((parsedNode) => `<li>${parsedNode?.title}</li>`)
    .join("");

  const repoNodeList = document.querySelector<HTMLUListElement>("#repo-list");
  if (!repoNodeList) throw new Error("Node list not found");

  const repo = await proxy.request("repo/list-all");
  console.log(repo);

  repoNodeList.innerHTML = repo.nodes
    .map((node) => JSON.parse(node.content))
    .map((parsedNode) => `<li>${parsedNode?.title}</li>`)
    .join("");
}

async function parse() {
  const currentTab = await getCurrentTab();
  if (!currentTab?.url) return;

  const { url, title = "" } = currentTab;

  document.querySelector<HTMLInputElement>(`[data-value="title"]`)!.value = title;
  document.querySelector<HTMLInputElement>(`[data-value="url"]`)!.value = url;
}

main();
