import * as cheerio from "cheerio";
import type { RequestHandler } from "../../lib/worker-ipc/proxy-server";

export interface ParseDocumentHtmlInput {
  html: string;
}
export interface ParseDocumentHtmlOutput {
  title?: string;
}

export const handleParseDocumentHtml: RequestHandler<ParseDocumentHtmlInput, ParseDocumentHtmlOutput> = async ({ data }) => {
  const $ = cheerio.load(data.html);
  const title = $("title").first().text();

  return {
    title,
  };
};
