import { Link, MessageToBackground, MetadataChanged } from "./messages";
import { sendToPort } from "./modules/browser";
import { addNode, dbAsync, getNodeBySrcUrl, getNodesBySrcUrls, getSrcNodesByTargetUrl } from "./modules/db";
import { send } from "./utils/send";
import { uuid } from "./utils/uuid";

// Avoid using globals, refactor into parameters
const linksCache: Record<string, undefined | Link[]> = {};
const portMap: Record<string, chrome.runtime.Port> = {};

// Event listeners must be registered in the root executation context
chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  id: "reload",
  title: "Reload service",
  contexts: ["action"],
});
chrome.contextMenus.onClicked.addListener(onContextMenuClick);
chrome.commands.onCommand.addListener(onCommand);
chrome.runtime.onConnect.addListener(onConnect);

function onConnect(port: chrome.runtime.Port) {
  console.log(`[background] port ${port.name} onConnect`, port.sender);
  switch (port.name) {
    case "background::main":
      port.onMessage.addListener(onPortMessage);
      portMap[port.sender!.id!] = port;
      break;
  }

  port.onDisconnect.addListener(onDisconnect);
}

function onDisconnect(port: chrome.runtime.Port) {
  console.log(`[background] port ${port.name} onDisconnect`, port.sender);
  delete portMap[port.sender!.id!];
}

async function onPortMessage(message: MessageToBackground, port: chrome.runtime.Port) {
  console.log(`[background] port ${port.name} onMessage ${message.type}`, port.sender);
  const reply = sendToPort(port);
  const db = await dbAsync;

  switch (message.type) {
    case "CAPTURE_PAGE":
      await onCapturePage(db, message.data.url, message.data.title);
      await onGetMetadata(db, reply, message.data.url);
      break;
    case "GET_METADATA":
      await onGetMetadata(db, reply, message.data.url);
      break;
    case "SET_LINKS":
      onSetLinks(message.data.url, message.data.links);
      await runOnPopupPort(message.data.popupId, (port) => onGetMetadata(db, sendToPort(port), message.data.url));
      break;
  }
}

function onSetLinks(url: string, links: Link[]) {
  linksCache[url] = links;
}

function runOnPopupPort(popupId: string | undefined, callback: (port: chrome.runtime.Port) => any) {
  if (!popupId) return;

  const port = portMap[popupId];
  if (port) return callback(port);
}

async function onCapturePage(db: IDBDatabase, url: string, title: string) {
  const targetUrls = linksCache[url] ?? [];
  const trimmedTitle = title.trim();
  const normalizedTitle = trimmedTitle.length ? trimmedTitle : "Untitled";

  console.log("[background] captured", [url, targetUrls]);

  await addNode(db, {
    id: uuid(),
    srcUrls: [url],
    targetUrls: targetUrls.map((url) => url.href),
    title: normalizedTitle,
    dateUpdated: new Date(),
  });
}

async function onGetMetadata(db: IDBDatabase, reply: (message: any) => any, url: string) {
  // TODO merge into single transaction
  const existingNode = await getNodeBySrcUrl(db, url);
  const inNodes = await getSrcNodesByTargetUrl(db, url);

  const targetUrls = linksCache[url]?.map((url) => url.href) ?? [];

  const [outNodes, urlsNotFound] = await getNodesBySrcUrls(db, targetUrls);
  const outEdges = linksCache[url]?.map((link) => link.href) ?? [];

  const latentLinks = linksCache[url]?.filter((link) => urlsNotFound.includes(link.href)) ?? [];

  send<MetadataChanged>(reply, "METADATA_CHANGED", {
    isCaptured: !!existingNode,
    outEdges,
    outNodes,
    inNodes,
    latentLinks,
  });
}

function reloadBackgroundService() {
  chrome.runtime.reload(); // reloads background
  chrome.tabs.reload(); // reloads popup
}

function onContextMenuClick(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
  switch (info.menuItemId) {
    case "reload":
      reloadBackgroundService();
      break;
  }
}

function onCommand(command: string, tab: chrome.tabs.Tab) {
  switch (command) {
    case "reload-service":
      reloadBackgroundService();
      break;
  }
}

// Pending: https://github.com/GoogleChrome/developer.chrome.com/issues/2602
// Ideally we want to open popup and inject content script both from service worker
// chrome.action.onClicked.addListener(async (tab) => {
//   chrome.action.openPopup();
// });
