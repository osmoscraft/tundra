import { CaptureFormElement } from "../modules/capture/capture-form-element";
import { extractLinks } from "../modules/capture/extract-links";
import { getActiveTab } from "../utils/get-active-tab";
import "./popup.css";

customElements.define("capture-form-element", CaptureFormElement);

export default async function main() {
  const captureForm = document.querySelector<CaptureFormElement>("capture-form-element")!;

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
