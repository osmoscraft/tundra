import type { RequestRoutes } from "../../interface/routes";
import { RequestRouteHandler } from "../../lib/ipc/server";

export const handleParseDocumentHtml: RequestRouteHandler<RequestRoutes, "parse-document-html"> = async ({ data }) => {
  return {
    title: `Mock document title from html of length ${data.html.length}`,
  };
};
