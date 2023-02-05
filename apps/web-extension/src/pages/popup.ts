import "./popup.css";

export default async function main() {
  const worker = new Worker("./worker.js", { type: "module" });
  const getActiveTab = () => chrome.tabs.query({ active: true, currentWindow: true });
  const on = (selector: string, type: string, callback: (e: Event) => any) =>
    document.querySelector(selector)?.addEventListener(type, callback);

  on("#capture-form", "submit", (e) => {
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
        func: extractFinks,
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

export interface Extraction {
  title: string;
  urls: string;
  target_urls: { title: string; url: string }[];
}

function extractFinks(): Extraction {
  const emptyTextToNull = (text?: string | null) => (text?.trim().length ? text.trim() : null);
  const title =
    emptyTextToNull(document.querySelector(`meta[property="og:title"]`)?.getAttribute("content")) ??
    emptyTextToNull(document.querySelector("title")?.textContent) ??
    "Untitled";
  const urls = emptyTextToNull(document.querySelector(`link[rel="canonical"]`)?.getAttribute("href")) ?? location.href;
  const target_anchors = [...document.querySelectorAll<HTMLAnchorElement>("a:not(:where(nav,header,footer) *)")];
  const target_urls = target_anchors
    .map((anchor) => {
      try {
        return { title: anchor.innerText.trim(), url: new URL(anchor.href) };
      } catch {
        return { title: "", url: null as any as URL };
      }
    })
    .filter((link) => link.title.length > 10 && link.url.protocol.startsWith("http"))
    .filter((link) => link.url.host !== location.host) // external links only
    .map((link) => ({ title: link.title, url: link.url.href }))
    .filter((link, index, array) => array.findIndex((otherLink) => otherLink.url === link.url) === index); // deduplicate

  console.log("[content-script] extracted ", target_urls);
  return {
    title,
    urls,
    target_urls,
  };
}

main();
