import { extractLinks } from "../modules/extraction/extract-links";
import type { MessageToMain, RequestCapture, RequestRecent, RequestTextMatch } from "../typings/messages";
import { getActiveTab } from "../utils/get-active-tab";
import { postMessage } from "../utils/post-message";
import "./popup.css";

export default async function main() {
  const worker = new Worker("./worker.js", { type: "module" });
  const omnibox = document.querySelector<HTMLInputElement>("#omnibox")!;
  const captureForm = document.querySelector<HTMLFormElement>("#capture-form")!;
  const nodeList = document.querySelector<HTMLUListElement>("#node-list")!;

  omnibox.addEventListener("input", (e) => {
    const query = (e.target as HTMLInputElement).value.trim();
    if (!query.length) {
      postMessage<RequestRecent>(worker, { name: "request-recent" });
    } else {
      const internalQuery = query
        .replace(/[\'"]/g, "")
        .replace(/\s+/g, " ")
        .split(" ")
        .map((word) => `"${word}"*`)
        .join(" ");

      console.log("internalQuery", internalQuery);
      performance.mark(`queryStart`);
      postMessage<RequestTextMatch>(worker, { name: "request-text-match", query: internalQuery });
    }
  });

  captureForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const captureForm = document.querySelector<HTMLFormElement>("#capture-form")!;
    const captureData = new FormData(captureForm);

    // TODO support alt ulrs
    postMessage<RequestCapture>(worker, {
      name: "request-capture",
      url: captureData.get("url") as string,
      title: captureData.get("title") as string,
      targetUrls: [...captureForm.querySelectorAll("a")].map((anchor) => anchor.href),
    });

    // re-render recent nodes
    postMessage<RequestRecent>(worker, { name: "request-recent" });
  });

  // render recent nodes
  postMessage<RequestRecent>(worker, { name: "request-recent" });

  worker.addEventListener("message", (event: MessageEvent<MessageToMain>) => {
    switch (event.data?.name) {
      case "recent-nodes-ready":
        nodeList.innerHTML = event.data.nodes
          .map((node) => /*html*/ `<li><a href="${node.url}" target="_blank">${node.title}</a></li>`)
          .join("");
        break;
      case "match-nodes-ready":
        console.log("query", performance.measure("query", `queryStart`).duration);
        nodeList.innerHTML = event.data.nodes
          .map((node) => /*html*/ `<li><a href="${node.url}" target="_blank">${node.html}</a></li>`)
          .join("");
        break;
    }
  });

  // render active tab
  getActiveTab()
    .then(([activeTab]) => {
      if (!activeTab?.id) throw Error("No active tab available");
      performance.mark("linkExtractionStart");
      return chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: extractLinks,
      });
    })
    .then((results) => {
      console.log("Extraction: ", performance.measure("linkExtraction", "linkExtractionStart").duration);
      const extraction = results[0]?.result;
      if (!extraction) throw new Error("Scripting error");

      document.querySelector<HTMLInputElement>("#url")!.value = extraction.url!;
      document.querySelector<HTMLInputElement>("#title")!.value = extraction.title!;
      document.querySelector<HTMLUListElement>("#target-url-list")!.innerHTML = extraction.target_urls
        .map(
          (url) => /*html*/ `
        <li><a href="${url.url}" target="_blank">${url.title}</a></li>
      `
        )
        .join("");
    });

  // autofocus
  omnibox.focus();
}

main();
