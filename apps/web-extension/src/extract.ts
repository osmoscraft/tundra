import { getCleanUrl } from "./utils/url";

export interface Extraction {
  title: string;
  url: string;
  altUrls: string[];
  links: { title: string; url: string }[];
  tags: string[];
  description: string;
}

export interface PageInfo {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface AltUrls {
  canonicalUrl?: string;
  shortlink?: string;
  ogUrl?: string;
}

export async function extractLinks(): Promise<Extraction> {
  const serverDomPromise: Promise<Document> = fetch(location.href)
    .then((response) => response.text())
    .then((html) => new DOMParser().parseFromString(html, "text/html"));

  const serverAltUrlsPromise = serverDomPromise.then(extractAltUrls).catch(() => ({}));
  const serverPageInfoPromise = serverDomPromise.then(extractPageInfo).catch(() => ({}));

  const title =
    emptyTextToNull(document.querySelector(`meta[property="og:title"]`)?.getAttribute("content")) ??
    emptyTextToNull(document.querySelector("title")?.textContent) ??
    "Untitled";
  const locationHref = location.href;
  const clientAltUrls = extractAltUrls(document);
  const clientPageInfo = extractPageInfo(document);
  const serverAltUrls = await serverAltUrlsPromise;
  const serverPageInfo = await serverPageInfoPromise;
  const allAltUrls = { ...clientAltUrls, ...serverAltUrls }; // server takes precedence
  const pageInfo = { ...clientPageInfo, ...serverPageInfo };

  const [url, ...altUrls] = [
    ...new Set(([locationHref, ...Object.values(allAltUrls)].filter(Boolean) as string[]).map(getCleanUrl)),
  ];

  // improve anchor extraction quality
  const anchors = [...document.querySelectorAll<HTMLAnchorElement>("a:not(:where(nav,header,footer,form) *)")];
  const links = anchors
    .map((anchor) => {
      try {
        return { title: anchor.innerText.trim(), url: new URL(anchor.href) };
      } catch {
        return { title: "", url: null as any as URL };
      }
    })
    .filter((link) => link.title.length > 10 && link.url.protocol.startsWith("http"))
    .filter((link) => link.url.host !== location.host) // external links only
    .map((link) => ({ title: link.title, url: link.url.href }))
    .filter((link, index, array) => array.findIndex((otherLink) => otherLink.url === link.url) === index); // deduplicate

  const extraction: Extraction = {
    title: pageInfo.title!,
    description: pageInfo.description ?? "",
    tags: pageInfo.keywords ?? [],
    url,
    altUrls,
    links,
  };

  console.log("[content-script] extracted ", {
    title,
    clientPageInfo,
    clientAltUrls,
    serverPageInfo,
    serverAltUrls,
  });

  return extraction;
}

function extractAltUrls(dom: Document): AltUrls {
  return {
    canonicalUrl: emptyTextToNull(dom.querySelector(`link[rel="canonical"]`)?.getAttribute("href")) ?? undefined,
    shortlink: dom.querySelector(`link[rel="shortlink"]`)?.getAttribute("href") ?? undefined,
    ogUrl: dom.querySelector(`meta[property="og:url"]`)?.getAttribute("content") ?? undefined,
  };
}

function extractPageInfo(dom: Document): PageInfo {
  return {
    title: dom.querySelector(`meta[property="og:title"]`)?.getAttribute("content") ?? dom.title,
    description:
      dom.querySelector(`meta[property="og:description"]`)?.getAttribute("content") ??
      dom.querySelector(`meta[name="description"]`)?.getAttribute("content") ??
      undefined,
    keywords: (dom.querySelector(`meta[name="keywords"]`)?.getAttribute("content") ?? "")
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean),
  };
}

function emptyTextToNull(text?: string | null) {
  return text?.trim().length ? text.trim() : null;
}

export default extractLinks;
