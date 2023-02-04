import { CapturePage, ExtractLinks, GetMetadata, MessageFromBackground, NodeMetadata } from "./messages";
import { getActiveTabId, getActiveTabMetadata, getActiveTabUrl, sendToPort } from "./modules/browser";
import { send } from "./utils/send";

async function main() {
  const backgroundPort = chrome.runtime.connect({ name: "background::main" });
  backgroundPort.onMessage.addListener(onPortMessage);

  const contentPort = await getActiveTabId().then((tabId) => chrome.tabs.connect(tabId, { name: "content::main" }));

  const sendToBackground = sendToPort(backgroundPort);
  const sendToContent = sendToPort(contentPort);

  document.addEventListener("click", onDataAction(sendToContent, sendToBackground));

  requestMetadata(sendToBackground);
}

const onDataAction =
  (sendToContent: (message: any) => any, sendToBackground: (message: any) => any) => async (event: Event) => {
    switch ((event.target as HTMLElement)?.getAttribute("data-action")) {
      case "scan":
        send<ExtractLinks>(sendToContent, "EXTRACT_LINKS", undefined);
        break;
      case "capture":
        send<CapturePage>(sendToBackground, "CAPTURE_PAGE", await getActiveTabMetadata());
        break;
    }
  };

function onPortMessage(message: MessageFromBackground, port: chrome.runtime.Port) {
  console.log(`[popup] port ${port.name} onMessage ${message.type}`, port.sender);
  switch (message.type) {
    case "LINKS_CHANGED":
      onLinks(message.data.links);
      break;
    case "METADATA_CHANGED":
      onMetadata(message.data);
      break;
  }
}

function onMetadata(metadata: NodeMetadata) {
  console.log("Metadata received", metadata);

  document.querySelector<HTMLElement>("#capture-checkmark")!.hidden = !metadata.isCaptured;
  document.querySelector<HTMLButtonElement>(`[data-action="capture"]`)!.disabled = metadata.isCaptured;

  const InNodesHtml = `${metadata.inNodes
    .map((node) => `<li><a href="${node.srcUrls[0]}">${node.title}</a></li>`)
    .join("")}`;
  document.querySelector<Element>("#in-nodes")!.innerHTML = InNodesHtml;
  document.querySelector<Element>("#in-node-count")!.innerHTML = `${metadata.inNodes.length}`;

  const outNodeHtml = `${metadata.outNodes
    .map((node) => `<li><a href="${node.srcUrls[0]}">${node.title}</a></li>`)
    .join("")}`;
  document.querySelector<Element>("#out-nodes")!.innerHTML = outNodeHtml;
  document.querySelector<Element>("#out-node-count")!.innerHTML = `${metadata.outNodes.length}`;

  const latentLinksHtml = `${metadata.latentLinks
    .map((link) => `<li><a href="${link.href}">${link.text}</a></li>`)
    .join("")}`;
  document.querySelector<Element>("#out-edges")!.innerHTML = latentLinksHtml;
  document.querySelector<Element>("#out-edge-count")!.innerHTML = `${metadata.latentLinks.length}`;
}

function onLinks(links: { href: string; text: string }[]) {
  console.log("Links received", links.length);
  const listItems = links
    .map((link) => Object.assign(document.createElement("a"), link))
    .map((anchor) => {
      const li = document.createElement("li");
      li.append(anchor);
      return li;
    });
  document.querySelector<Element>("#out-edges")!.innerHTML = "";
  document.querySelector<Element>("#out-edges")!.append(...listItems);
}

function requestMetadata(sendFn: (message: any) => any) {
  return getActiveTabUrl().then((url) => send<GetMetadata>(sendFn, "GET_METADATA", { url }));
}

main();
