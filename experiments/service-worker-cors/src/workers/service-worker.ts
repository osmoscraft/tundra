/// <reference lib="WebWorker" />

declare const self: ServiceWorkerGlobalScope;

console.log("Service worker started");

// chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
//   /**
//    * A tab becomes "dirty" when its URL was manipulated by JavaScript on the client side.
//    * As a result, the metadata in the `<head>` element might not match the latest content
//    * on the UI.
//    */

//   /* only handle top level frames */
//   if (details.frameId === 0) {
//     chrome.scripting.executeScript({
//       target: { tabId: details.tabId },
//       files: ["content-scripts/set-history-dirty.js"],
//     });
//   }
// });

export default self;
