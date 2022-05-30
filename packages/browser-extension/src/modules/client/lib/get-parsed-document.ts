export interface DocumentMetadata {
  title: string;
  url: string;
  canonicalUrl?: string;
}

export async function getDocumentMetadata() {
  const title = document.title;
  const url = document.location.href;
  const canonicalUrl = document.querySelector(`link[rel="canonical"]`)?.getAttribute("href") ?? undefined;

  return {
    title,
    url,
    canonicalUrl,
  };
}
