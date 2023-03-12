import { CaptureData, CaptureFormElement } from "./modules/capture/capture-form-element";
import { extractLinks } from "./modules/capture/extract-links";
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

  captureForm.addEventListener("request-capture", async (e) => {
    const connection = getConnection();
    if (!connection) return;

    const { respondCapture } = await requestWorker({
      requestCapture: {
        githubConnection: connection,
        data: (e as CustomEvent<CaptureData>).detail,
      },
    });

    console.log(`[capture]`, respondCapture);

    await requestWorker({
      requestGithubPull: connection,
    });

    console.log("[capture] pulled");

    captureForm.reset();
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

      // TODO check DB for existing node

      // assuming no existing node, render creation form
      captureForm.loadExtractionResult(extraction);
    });
}

main();
