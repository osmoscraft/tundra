import { RequestRouteHandler } from "../../ipc/server";
import { RequestRoutes } from "../worker";

export const handleParseDocumentHtml: RequestRouteHandler<RequestRoutes, "parse-document-html"> = async (data) => {
  return {
    title: `Mock document title from html of length ${data.html.length}`,
  };
};
