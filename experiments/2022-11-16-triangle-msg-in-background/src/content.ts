import { SetContentHtml, SetLinks } from "./messages";
import { postTypedMessage } from "./modules/typed-message";
import { timed } from "./utils/timed";

/**
 * In order to bundle the content script and keep it compatible with `chrome.scripting` api, make sure each file uses the following format:
 * ```typescript
 * export default function nameOfFunciont() {
 *   // implementation
 * }
 * ```
 * See related setup in `build.js`
 */

function acceptNode(onAccept: (node: Node) => any, node: Node) {
  switch ((node as Element).tagName) {
    case "HEADER":
      return NodeFilter.FILTER_REJECT;
    case "FOOTER":
      return NodeFilter.FILTER_REJECT;
    case "NAV":
      return NodeFilter.FILTER_REJECT;
    case "A":
      return acceptAnchor(onAccept, node as HTMLAnchorElement);
    default:
      return NodeFilter.FILTER_SKIP;
  }
}

function acceptAnchor(onAccept: (node: HTMLAnchorElement) => any, node: HTMLAnchorElement) {
  const trimmedText = node.textContent?.trim();
  if (!trimmedText?.length) return NodeFilter.FILTER_REJECT;
  if (node.getAttribute("href")?.startsWith("#")) return NodeFilter.FILTER_REJECT;

  const href = new URL(node.href);
  if (!href.protocol.startsWith("http")) return NodeFilter.FILTER_REJECT;

  onAccept(node);
  return NodeFilter.FILTER_ACCEPT;
}

function* walk(onAccept: (node: Node) => any, root: Node): Generator<void, void, unknown> {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: acceptNode.bind(null, onAccept),
  });
  while (true) {
    const element = walker.nextNode() as Element | null;
    if (!element) return;

    yield;
  }
}

export default function requestDom() {
  const port = chrome.runtime.connect({ name: "background::main" });
  postTypedMessage<SetContentHtml>(port, "SET_CONTENT_HTML", {
    url: location.href,
    html: document.documentElement.innerHTML,
  });

  const allLinks: Record<string, { href: string; text: string }> = {};

  timed(() => [
    ...walk((link) => {
      allLinks[(link as HTMLAnchorElement).href] = {
        href: (link as HTMLAnchorElement).href,
        text: link.textContent!.trim(),
      };
    }, document.body),
  ])();

  postTypedMessage<SetLinks>(port, "SET_LINKS", {
    url: location.href,
    links: Object.values(allLinks),
  });
}

// No need to call default exported function. Chrome runtime will execute.
