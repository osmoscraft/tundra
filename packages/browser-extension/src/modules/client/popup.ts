import { ProxyClient } from "../lib/worker-ipc/proxy-client";
import type { ProxySchema } from "../server/worker";
import { getCurrentTab } from "./lib/get-current-tab";
import { parse } from "./lib/parse-local";

export default async function main() {
  const worker = new SharedWorker("./modules/server/worker.js", { name: "tinykb-worker" });
  const proxyClient = new ProxyClient<ProxySchema>(worker.port);

  worker.port.start();

  parseCurrentDocument(proxyClient);
}

async function parseCurrentDocument(proxyClient: ProxyClient<ProxySchema>) {
  const currentTabId = (await getCurrentTab())?.id;
  if (!currentTabId) throw new Error("Cannot find any active tab");

  const localParseResult = await parse(currentTabId);

  const remoteParseResult = await proxyClient.request("parse-document-html", {
    url: localParseResult.url,
    html: localParseResult.html,
  });

  document.querySelector<HTMLHeadingElement>(`[data-value="title"]`)!.innerText = remoteParseResult.title ?? localParseResult.title;
  document.querySelector<HTMLInputElement>(`[data-value="url"]`)!.value =
    remoteParseResult.canonicalUrl ?? localParseResult.canonicalUrl ?? localParseResult.url;
}

main();
