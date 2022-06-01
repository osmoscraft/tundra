import * as cheerio from "cheerio";
import type { RequestHandler } from "../../lib/worker-ipc/proxy-server";

export interface ParseDocumentHtmlInput {
  url: string;
}
export interface ParseDocumentHtmlOutput {
  canonicalUrl?: string;
  title?: string;
}

export const handleParseDocumentHtml: RequestHandler<ParseDocumentHtmlInput, ParseDocumentHtmlOutput> = async ({ input }) => {
  const fetchedHtml = await (await fetch(input.url)).text();

  const $ = cheerio.load(fetchedHtml);
  const title = $("title").first().text();
  const canonicalUrl = $(`link[rel="canonical"]`).attr("href");

  return {
    title,
    canonicalUrl,
  };
};
