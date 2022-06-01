export interface DocumentDetails {
  title: string;
  url: string;
  canonicalUrl?: string;
  html: string;
}

export default async function (): Promise<DocumentDetails> {
  const html = document._tinykb?.isHistoryDirty ? await (await fetch(location.href)).text() : document.documentElement.outerHTML;
  const title = document.title;
  const url = document.location.href;
  const canonicalUrl = document.querySelector(`link[rel="canonical"]`)?.getAttribute("href") ?? undefined;

  return {
    html,
    title,
    url,
    canonicalUrl,
  };
}
