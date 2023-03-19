import type { Extraction } from "./extract";
import { CaptureFormElement, CaptureRequest } from "./modules/capture/capture-form-element";
import { GraphStatsElement } from "./modules/graph/graph-stats-element";
import { getConnection } from "./modules/sync/github/config-storage";
import { loadWorker } from "./modules/worker/load-worker";
import { getNotifier, getRequester } from "./modules/worker/notify";
import type { MessageToMainV2, MessageToWorkerV2 } from "./typings/messages";
import { getActiveTab } from "./utils/get-active-tab";

import { WorkerTerminalElement } from "./modules/worker/worker-terminal-element";
import "./styles/global.css";

customElements.define("capture-form-element", CaptureFormElement);
customElements.define("graph-stats-element", GraphStatsElement);
customElements.define("worker-terminal-element", WorkerTerminalElement);

const worker = loadWorker();
const notifyWorker = getNotifier<MessageToWorkerV2>(worker);
const requestWorker = getRequester<MessageToWorkerV2, MessageToMainV2>(worker);

export default async function main() {
  const captureForm = document.querySelector<CaptureFormElement>("capture-form-element")!;
  const graphStats = document.querySelector<GraphStatsElement>("graph-stats-element")!;

  const handleCapture = async (e: Event) => {
    const connection = getConnection();
    if (!connection) return;

    const { respondCapture } = await requestWorker({
      requestCapture: {
        githubConnection: connection,
        node: (e as CustomEvent<CaptureRequest>).detail.node,
        isUpdate: (e as CustomEvent<CaptureRequest>).detail.isUpdate,
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
    const results = await chrome.scripting.executeScript<any[], Extraction>({
      target: { tabId: activeTab.id },
      files: ["extract.js"],
    });
    console.log("Extraction: ", performance.measure("linkExtraction", "linkExtractionStart").duration);
    const extraction = results[0]?.result;
    if (!extraction) throw new Error("Scripting error");
    return extraction;
  };

  const handleExtraction = async (extraction: Extraction) => {
    // wip
    console.log(`[extraction]`, extraction);
    const { respondGraphStats } = await requestWorker({
      requestGraphStats: {
        url: extraction.url,
        linkUrls: (extraction.links ?? []).map((link) => link.url),
      },
    });
    graphStats.loadData(respondGraphStats!);

    const { respondDbNodesByUrls } = await requestWorker({ requestDbNodesByUrls: [extraction.url] });

    if (respondDbNodesByUrls?.[0]) {
      captureForm.loadExisting(respondDbNodesByUrls[0].content, respondDbNodesByUrls[0].path);
    } else {
      captureForm.loadExtractionResult(extraction);
    }
  };

  // initial sync
  const connection = getConnection();
  if (connection) {
    requestWorker({ requestGithubPull: connection }).then((response) => {
      if (response.respondGitHubPull!.changeCount) {
        // need re-extract when there is change
        getActiveTab().then(extractLinksOnActiveTab).then(handleExtraction);
      }
    });
    //
  }

  // initial data load
  getActiveTab().then(extractLinksOnActiveTab).then(handleExtraction);
}

main();
