import { ProxyClient } from "../lib/worker-ipc/proxy-client";
import type { ProxySchema } from "../server/worker";
import { getCurrentTab } from "./lib/get-current-tab";
import { parseCurrentDocument } from "./lib/parse-current-document";

export default async function main() {
  const worker = new SharedWorker("./modules/server/worker.js", { name: "tinykb-worker" });
  const proxyClient = new ProxyClient<ProxySchema>(worker.port);
  worker.port.start();

  handleDataAction(proxyClient);
  parse(proxyClient);

  const getNodesResponse = await proxyClient.request("get-nodes", {});
  console.log(getNodesResponse);
  showNodeList(getNodesResponse.nodes);
}

async function parse(proxyClient: ProxyClient<ProxySchema>) {
  const currentTab = await getCurrentTab();
  if (!currentTab?.id) throw new Error("Cannot find any active tab");
  if (!currentTab?.url) throw new Error("Cannot access current tab url");

  const [remoteParseResult, localParseResult] = await Promise.all([
    proxyClient.request("parse-document-html", {
      url: currentTab.url,
    }),
    parseCurrentDocument(currentTab.id),
  ]);

  document.querySelector<HTMLInputElement>(`[data-value="title"]`)!.value = remoteParseResult.title ?? localParseResult.title;
  document.querySelector<HTMLInputElement>(`[data-value="url"]`)!.value =
    remoteParseResult.canonicalUrl ?? localParseResult.canonicalUrl ?? localParseResult.url;
}

function handleDataAction(proxyClient: ProxyClient<ProxySchema>) {
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
