import { getDocumentHtml } from "../content-script/get-document-html";

const worker = new SharedWorker("./modules/service/worker.js", { name: "shared-worker" });
console.log("hello popup");

worker.port.addEventListener("message", (message) => console.log(message));

worker.port.start();

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

export default async function main() {
  const parse = document.querySelector<HTMLButtonElement>(`[data-input="parse"]`)!;

  chrome.runtime.onMessage.addListener((e) => {
    console.log(`[runtime msg]`, e);
  });

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
  });
}

main();
