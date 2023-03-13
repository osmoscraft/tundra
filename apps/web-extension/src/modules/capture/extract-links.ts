export interface Extraction {
  title: string;
  url: string;
  links: { title: string; url: string }[];
  description: string;
}

export function extractLinks(): Extraction {
  const emptyTextToNull = (text?: string | null) => (text?.trim().length ? text.trim() : null);
  const title =
    emptyTextToNull(document.querySelector(`meta[property="og:title"]`)?.getAttribute("content")) ??
    emptyTextToNull(document.querySelector("title")?.textContent) ??
    "Untitled";
  const canonical = emptyTextToNull(document.querySelector(`link[rel="canonical"]`)?.getAttribute("href"));
  const url = location.href;
  const anchors = [...document.querySelectorAll<HTMLAnchorElement>("a:not(:where(nav,header,footer) *)")];
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

  console.log("[content-script] extracted ", links);
  return {
    title,
    url: canonical ?? url,
    links: links,
    description: "",
  };
}
