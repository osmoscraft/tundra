import { extractLinks } from "../modules/extraction/extract-links";
import { getActiveTab } from "../utils/get-active-tab";
import "./popup.css";

export default async function main() {
  const worker = new Worker("./worker.js", { type: "module" });
  const captureForm = document.querySelector<HTMLFormElement>("#capture-form")!;

  captureForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const captureForm = document.querySelector<HTMLFormElement>("#capture-form")!;
    const captureData = new FormData(captureForm);

    worker.postMessage({
      name: "request-capture",
      urls: captureData.get("url"),
      title: captureData.get("title"),
      target_urls: [...captureForm.querySelectorAll("a")].map((anchor) => anchor.href).join(" "),
    });
  });

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

      document.querySelector<HTMLInputElement>("#url")!.value = extraction.urls!;
      document.querySelector<HTMLInputElement>("#title")!.value = extraction.title!;
      document.querySelector<HTMLUListElement>("#target-url-list")!.innerHTML = extraction.target_urls
        .map(
          (url) => /*html*/ `
        <li><a href="${url.url}" target="_blank">${url.title}</a></li>
      `
        )
        .join("");
    });
}

main();
