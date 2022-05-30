import { getDocumentHtml } from "../content-script/get-document-html";
import { WorkerClient } from "../ipc/client";
import { Routes } from "../server/worker";

const worker = new SharedWorker("./modules/server/worker.js", { name: "tinykb-worker" });
const workerClient = new WorkerClient<Routes>(worker.port);
worker.port.start();

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

export default async function main() {
  const parse = document.querySelector<HTMLButtonElement>(`[data-input="parse"]`)!;

  parse.addEventListener("click", async () => {
    const currentTab = await getCurrentTab();
    console.log(currentTab);
    if (!currentTab.id) return;

    const start = performance.now();
    const results = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: getDocumentHtml,
    });
    console.log(`[rpc] ${performance.now() - start}`);

    console.log(results[0].result?.length);

    const parseResult = await workerClient.request("parse-document-html", results[0].result);
    console.log(`[parse result]`, parseResult);
  });
}

main();
