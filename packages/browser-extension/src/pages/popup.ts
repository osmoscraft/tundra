import { getMessageSender } from "../workers/lib/message";
import type { RouteSchema } from "../workers/shared-worker";
import { getCurrentTab } from "./lib/get-current-tab";

export default async function main() {
  const worker = new SharedWorker("./workers/shared-worker.js", { name: "tinykb-worker" });
  const sendMessage = getMessageSender<RouteSchema>(worker.port);
  worker.port.start();

  parse();

  window.addEventListener("click", async (e) => {
    const actionTrigger = (e.target as HTMLElement)?.closest("[data-action]");
    switch (actionTrigger?.getAttribute("data-action")) {
      case "capture":
        const content = JSON.stringify({
          title: document.querySelector<HTMLInputElement>(`[data-value="title"]`)!.value,
          url: document.querySelector<HTMLInputElement>(`[data-value="url"]`)!.value,
        });
        const output = await sendMessage("create-node", {
          mediaType: "application/json",
          content,
        });
        console.log(output);
        break;
    }
  });

  const getNodesResult = await sendMessage("get-nodes");
  const nodeList = document.querySelector<HTMLUListElement>("#node-list");
  if (!nodeList) throw new Error("Node list not found");

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
