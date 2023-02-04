import { GetLinks, MessageToBackground } from "./messages";
import { parseHtml } from "./modules/parser";
import { sendTypedResponse } from "./modules/typed-message";

console.log("background live 3");

const onConnect = (port: chrome.runtime.Port) => {
  switch (port.name) {
    case "background::main":
      console.log(`New connection on ${port.name}`);
      port.onMessage.addListener(onPortMessage);
      break;
  }
};

let mockDB: Record<string, { href: string; text: string }[]> = {}; // HACK volatile memory. replace with IndexedDB
let mockDBV2: Record<string, { href: string; text: string }[]> = {};

const onPortMessage = (message: MessageToBackground) => {
  switch (message.type) {
    case "SET_CONTENT_HTML":
      const links = parseHtml(message.req.html);
      mockDB[message.req.url] = links;
      break;
    case "SET_LINKS":
      const linksV2 = message.req.links;
      mockDBV2[message.req.url] = linksV2;
      break;
  }
};

const onMessage = (
  message: MessageToBackground,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => any
) => {
  switch (message.type) {
    case "GET_LINKS":
      sendTypedResponse<GetLinks>(sendResponse, mockDBV2[message.req.url] ?? []);
      break;
  }
};

const reloadBackgroundService = () => {
  chrome.runtime.reload(); // reloads background
  chrome.tabs.reload(); // reloads popup
};

const onContextMenuClick = (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
  switch (info.menuItemId) {
    case "reload":
      reloadBackgroundService();
      break;
  }
};

const onCommand = (command: string, tab: chrome.tabs.Tab) => {
  switch (command) {
    case "reload-service":
      reloadBackgroundService();
      break;
  }
};

chrome.runtime.onConnect.addListener(onConnect);
chrome.runtime.onMessage.addListener(onMessage);
chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  id: "reload",
  title: "Reload service",
  contexts: ["action"],
});
chrome.contextMenus.onClicked.addListener(onContextMenuClick);
chrome.commands.onCommand.addListener(onCommand);

// Pending: https://github.com/GoogleChrome/developer.chrome.com/issues/2602
// Ideally we want to open popup and inject content script both from service worker
// chrome.action.onClicked.addListener(async (tab) => {
//   chrome.action.openPopup();
// });
