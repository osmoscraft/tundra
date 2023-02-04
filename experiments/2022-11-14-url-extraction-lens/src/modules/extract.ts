export function extractLinks() {
  const allLinks: Record<string, { href: string; text: string }> = {};

  walk((link) => {
    allLinks[(link as HTMLAnchorElement).href] = {
      href: (link as HTMLAnchorElement).href,
      text: link.textContent!.trim(),
    };
  }, document.body);

  return Object.values(allLinks);
}

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
  if (node.getAttribute("href")?.startsWith("#")) return NodeFilter.FILTER_REJECT; // href attr is different from href prop

  const href = node.href;
  if (!href) return NodeFilter.FILTER_REJECT;

  try {
    const url = new URL(href);
    if (!url.protocol.startsWith("http")) return NodeFilter.FILTER_REJECT;
    if (url.hostname === location.hostname && url.pathname === location.pathname) return NodeFilter.FILTER_REJECT;
  } catch {
    return NodeFilter.FILTER_REJECT;
  }

  onAccept(node);
  return NodeFilter.FILTER_ACCEPT;
}

function walk(onAccept: (node: Node) => any, root: Node): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: acceptNode.bind(null, onAccept),
  });
  while (walker.nextNode()) {}
}
