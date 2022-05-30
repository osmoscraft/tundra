import type { RequestHandler } from "../../lib/worker-ipc/proxy-server";

export interface ParseDocumentHtmlInput {
  html: string;
}
export interface ParseDocumentHtmlOutput {
  title: string;
}

export const handleParseDocumentHtml: RequestHandler<ParseDocumentHtmlInput, ParseDocumentHtmlOutput> = async ({ data }) => {
  return {
    title: `Mock document title from html of length ${data.html.length}`,
  };
};
