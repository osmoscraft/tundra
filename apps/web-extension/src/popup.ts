import { CaptureFormElement, CaptureRequest } from "./modules/capture/capture-form-element";
import { Extraction, extractLinks } from "./modules/capture/extract-links";
import { getConnection } from "./modules/sync/github/config-storage";
import { loadWorker } from "./modules/worker/load-worker";
import { getNotifier, getRequester } from "./modules/worker/notify";
import type { MessageToMainV2, MessageToWorkerV2 } from "./typings/messages";
import { getActiveTab } from "./utils/get-active-tab";

import "./styles/global.css";

customElements.define("capture-form-element", CaptureFormElement);

const worker = loadWorker();
const notifyWorker = getNotifier<MessageToWorkerV2>(worker);
const requestWorker = getRequester<MessageToWorkerV2, MessageToMainV2>(worker);

export default async function main() {
  const captureForm = document.querySelector<CaptureFormElement>("capture-form-element")!;

  const handleCapture = async (e: Event) => {
    const connection = getConnection();
    if (!connection) return;

    const { respondCapture } = await requestWorker({
      requestCapture: {
        githubConnection: connection,
        data: (e as CustomEvent<CaptureRequest>).detail,
      },
    });

    console.log(`[capture]`, respondCapture);

    await requestWorker({
      requestGithubPull: connection,
    });

    console.log("[capture] pulled");

    location.reload();
  };

  captureForm.addEventListener("request-capture", handleCapture);

  const extractLinksOnActiveTab = async (tabs: chrome.tabs.Tab[]) => {
    const [activeTab] = tabs;
    if (!activeTab?.id) throw Error("No active tab available");
    performance.mark("linkExtractionStart");
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: extractLinks,
    });
    console.log("Extraction: ", performance.measure("linkExtraction", "linkExtractionStart").duration);
    const extraction = results[0]?.result;
    if (!extraction) throw new Error("Scripting error");
    return extraction;
  };

  const loadCaptureForm = async (extraction: Extraction) => {
    const { respondDbNodesByUrls } = await requestWorker({ requestDbNodesByUrls: [extraction.url] });
    console.log(respondDbNodesByUrls);

    if (respondDbNodesByUrls?.[0]) {
      captureForm.loadExisting(
        {
          title: respondDbNodesByUrls[0].content.title,
          description: respondDbNodesByUrls[0].content.description,
          url: respondDbNodesByUrls[0].content.url,
          links: respondDbNodesByUrls[0].content.links,
        },
        respondDbNodesByUrls[0].path
      );
    } else {
      captureForm.loadExtractionResult(extraction);
    }
  };

  getActiveTab().then(extractLinksOnActiveTab).then(loadCaptureForm);
}

main();
