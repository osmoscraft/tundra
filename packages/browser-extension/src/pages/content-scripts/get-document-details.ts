export interface DocumentDetails {
  title: string;
  url: string;
  canonicalUrl?: string;
  html: string;
}

export default function (): DocumentDetails {
  const html = document.documentElement.outerHTML;
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
