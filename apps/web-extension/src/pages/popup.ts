import { downloadFile } from "../utils/download-file";
import "./popup.css";

export default async function main() {
  const worker = new Worker("./worker.js", { type: "module" });
  const getActiveTab = () => chrome.tabs.query({ active: true, currentWindow: true });
  const on = (selector: string, type: string, callback: (e: Event) => any) =>
    document.querySelector(selector)?.addEventListener(type, callback);

  on("#download", "click", () => {
    worker.postMessage({ name: "request-download" });
  });
  on("#reset", "click", () => {
    worker.postMessage({ name: "request-reset" });
  });
  on("#capture-form", "submit", (e) => {
    e.preventDefault();

    getActiveTab()
      .then(([activeTab]) => {
        if (!activeTab?.id) throw Error("No active tab available");

        performance.mark("linkExtractionStart");
        return chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: extractFinks,
        });
      })
      .then((results) => {
        console.log(performance.measure("linkExtraction", "linkExtractionStart").duration);
        console.log(results);

        worker.postMessage({
          name: "request-capture",
          urls: new FormData(e.target as HTMLFormElement).get("omnibox") as string,
          title: "Hello world",
          target_urls: "",
        });
      });
  });

  worker.addEventListener("message", async (msg) => {
    if (msg.data?.name === "file-download-ready") {
      downloadFile(msg.data.file);
    }
  });

  getActiveTab().then(([activeTab]) => {
    document.querySelector<HTMLInputElement>("#omnibox")!.value = activeTab.url!;
  });
}

function extractFinks() {
  const links = document.querySelectorAll("a");
  console.log("[content-script] extracted", links);
  return [...links].map((l) => l.href);
}

main();
