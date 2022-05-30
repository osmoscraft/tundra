import { getDocumentHtml } from "./get-document-html";
import { DocumentMetadata, getDocumentMetadata } from "./get-parsed-document";
import { withTimer } from "./with-timer";

export async function parse(tabId: number) {
  const [metadataResult] = await withTimer(
    () =>
      chrome.scripting.executeScript({
        target: { tabId },
        func: getDocumentMetadata,
      }),
    (d) => console.log(`[execute-script] ${d}ms`)
  )();

  const [htmlResult] = await withTimer(
    () =>
      chrome.scripting.executeScript({
        target: { tabId },
        func: getDocumentHtml,
      }),
    (d) => console.log(`[execute-script] ${d}ms`)
  )();

  return {
    ...(metadataResult.result as DocumentMetadata),
    html: htmlResult.result,
  };
}
