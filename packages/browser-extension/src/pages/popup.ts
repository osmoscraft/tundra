import { ProxyClient } from "../lib/worker-ipc/proxy-client";
import type { MessageSchema } from "../workers/shared-worker";
import { getCurrentTab } from "./lib/get-current-tab";

export default async function main() {
  const worker = new SharedWorker("./workers/shared-worker.js", { name: "tinykb-worker" });
  const proxyClient = new ProxyClient<MessageSchema>(worker.port);
  worker.port.start();

  handleDataAction(proxyClient);
  parse();

  const getNodesResponse = await proxyClient.request("get-nodes", {});
  showNodeList(getNodesResponse.nodes);
}

async function parse() {
  const currentTab = await getCurrentTab();
  if (!currentTab?.url) return;

  const { url, title = "" } = currentTab;

  document.querySelector<HTMLInputElement>(`[data-value="title"]`)!.value = title;
  document.querySelector<HTMLInputElement>(`[data-value="url"]`)!.value = url;
}

function handleDataAction(proxyClient: ProxyClient<MessageSchema>) {
  window.addEventListener("click", async (e) => {
    const actionTrigger = (e.target as HTMLElement)?.closest("[data-action]");
    switch (actionTrigger?.getAttribute("data-action")) {
      case "capture":
        const id = await proxyClient.request("create-node", {
          mediaType: "application/json",
          content: JSON.stringify({
            title: document.querySelector<HTMLInputElement>(`[data-value="title"]`)!.value,
            url: document.querySelector<HTMLInputElement>(`[data-value="url"]`)!.value,
          }),
        });
        console.log(id);
        break;
    }
  });
}

function showNodeList(nodes: any[]) {
  const nodeList = document.querySelector<HTMLUListElement>("#node-list");
  if (!nodeList) throw new Error("Node list not found");

  const nodesHtml = nodes.map((node) => `<li>${node?.title}</li>`).join("");
  nodeList.innerHTML = nodesHtml;
}

main();
