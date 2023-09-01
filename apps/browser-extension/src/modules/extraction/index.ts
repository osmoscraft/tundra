export async function extractWebPage(url: string) {
  const response = await fetch(url);
  const contentType = response.headers.get("content-type");
  if (!contentType) {
    console.warn("content-type missing in HTTP header");
    return null;
  }

  if (!contentType.includes("text/html")) {
    console.warn(`Invalid content type ${contentType}`);
    return null;
  }

  try {
    const dom = new DOMParser().parseFromString(await response.text(), "text/html");

    return {
      title: extractTitle(dom),
    };
  } catch (e) {
    console.warn("Extraction failed", e);
    return null;
  }
}

function extractTitle(dom: Document): string {
  let title = dom.querySelector(`meta[property="og:title"]`)?.getAttribute("content")?.trim();

  if (!title) {
    title = dom.querySelector(`meta[name="twitter:title"]`)?.getAttribute("content")?.trim();
  }

  if (!title) {
    title = dom.querySelector("title")?.innerText?.trim();
  }

  if (!title) {
    title = dom.querySelector("h1")?.innerText?.trim();
  }

  if (!title) {
    title = "Untitled";
  }

  return title;
}
