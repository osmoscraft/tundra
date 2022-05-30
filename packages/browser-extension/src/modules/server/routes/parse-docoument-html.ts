import * as cheerio from "cheerio";
import type { RequestHandler } from "../../lib/worker-ipc/proxy-server";

export interface ParseDocumentHtmlInput {
  html: string;
  url: string;
}
export interface ParseDocumentHtmlOutput {
  canonicalUrl?: string;
  title?: string;
}

export const handleParseDocumentHtml: RequestHandler<ParseDocumentHtmlInput, ParseDocumentHtmlOutput> = async ({ data }) => {
  const fetchedHtml = await (await fetch(data.url)).text();

  const $ = cheerio.load(fetchedHtml);
  const title = $("title").first().text();
  const canonicalUrl = $(`link[rel="canonical"]`).attr("href");

  return {
    title,
    canonicalUrl,
  };
};
