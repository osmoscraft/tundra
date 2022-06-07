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
        });
        await proxy.request("create-node", {
          id: crypto.randomUUID(),
          content,
        });
        break;
    }
  });

  const getNodesResult = await proxy.request("get-nodes", {});
  const nodeList = document.querySelector<HTMLUListElement>("#node-list");
  if (!nodeList) throw new Error("Node list not found");

  const logResult = await proxy.request("get-status");
  console.log(logResult);

  const nodesHtml = getNodesResult.nodes.map((node) => `<li>${node?.title}</li>`).join("");
  nodeList.innerHTML = nodesHtml;
}

async function parse() {
  const currentTab = await getCurrentTab();
  if (!currentTab?.url) return;

  const { url, title = "" } = currentTab;

  document.querySelector<HTMLInputElement>(`[data-value="title"]`)!.value = title;
  document.querySelector<HTMLInputElement>(`[data-value="url"]`)!.value = url;
}

main();
