import type { DocumentDetails } from "../content-scripts/get-document-details";
import { withTimer } from "./with-timer";

export async function parseCurrentDocument(tabId: number) {
  const [documentDetailsResult] = await withTimer(
    () =>
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["./pages/content-scripts/get-document-details.js"],
      }),
    (d) => console.log(`[execute-script] ${d}ms`)
  )();

  const result = documentDetailsResult.result;
  if (!result) throw new Error("Parse error");

  return result as DocumentDetails;
}
