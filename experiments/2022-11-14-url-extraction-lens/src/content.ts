/**
 * In order to bundle the content script and keep it compatible with `chrome.scripting` api, make sure each file uses the following format:
 * ```typescript
 * export default function nameOfFunciont() {
 *   // implementation
 * }
 * ```
 * See related setup in `build.js`
 */

import { MessageToContent, SetLinks } from "./messages";
import { sendToPort } from "./modules/browser";
import { extractLinks } from "./modules/extract";
import { toIdleCallback } from "./utils/run-on-idle";
import { send } from "./utils/send";
import { timed } from "./utils/timed";

export default function main() {
  const backgroundPort = chrome.runtime.connect({ name: "background::main" });
  const sendToBackground = sendToPort(backgroundPort);

  chrome.runtime.onConnect.addListener(onConnect(onPortMessage(sendToBackground)));

  sendInitialLinksOnIdle(sendToBackground)();
}

const timedExtractLinks = timed(extractLinks, "Link extraction");

const sendInitialLinks = (sendFn: (message: any) => any) =>
  send<SetLinks>(sendFn, "SET_LINKS", { url: location.href, links: timedExtractLinks() });

const sendInitialLinksOnIdle = (sendFn: (message: any) => any) =>
  toIdleCallback(3000, sendInitialLinks.bind(null, sendFn));

const onConnect =
  (onPortMessage: (message: any, remotePort: chrome.runtime.Port) => any) => (localPort: chrome.runtime.Port) => {
    console.log(`[content] port ${localPort.name} onConnect`);
    switch (localPort.name) {
      case "content::main":
        localPort.onMessage.addListener(onPortMessage);
        break;
    }
  };

const onPortMessage =
  (sendToBackground: (message: any) => any) => (message: MessageToContent, replyPort: chrome.runtime.Port) => {
    console.log(`[content] port ${replyPort.name} onMessage ${message.type}`, replyPort.sender);
    switch (message.type) {
      case "EXTRACT_LINKS":
        send<SetLinks>(sendToBackground, "SET_LINKS", {
          url: location.href,
          popupId: replyPort.sender!.id,
          links: extractLinks(),
        });
        break;
    }
  };

// No need to call default exported function. Chrome runtime will execute.
