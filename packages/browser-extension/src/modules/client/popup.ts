import { ProxyClient } from "../lib/worker-ipc/proxy-client";
import type { ProxySchema } from "../server/worker";
import { getCurrentTab } from "./lib/get-current-tab";
import { parseCurrentDocument } from "./lib/parse-current-document";

export default async function main() {
  const worker = new SharedWorker("./modules/server/worker.js", { name: "tinykb-worker" });
  const proxyClient = new ProxyClient<ProxySchema>(worker.port);

  worker.port.start();

  parse(proxyClient);
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

  document.querySelector<HTMLHeadingElement>(`[data-value="title"]`)!.innerText = remoteParseResult.title ?? localParseResult.title;
  document.querySelector<HTMLInputElement>(`[data-value="url"]`)!.value =
    remoteParseResult.canonicalUrl ?? localParseResult.canonicalUrl ?? localParseResult.url;
}

main();
