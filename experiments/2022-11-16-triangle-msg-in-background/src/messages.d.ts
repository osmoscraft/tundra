import { TypedMessage } from "./modules/typed-message";

// * -> background
export type MessageToBackground = SetContentHtml | SetLinks | GetLinks;

export interface SetLinks extends TypedMessage {
  type: "SET_LINKS";
  req: { url: string; links: { href: string; text: string }[] };
}

export interface SetContentHtml extends TypedMessage {
  type: "SET_CONTENT_HTML";
  req: { url: string; html: string };
}

export interface GetLinks extends TypedMessage {
  type: "GET_LINKS";
  req: { url: string };
  res: { href: string; text: string }[];
}

// * -> content

export type MessageToContent = any;

export interface ExtractLinks extends TypedMessage {
  type: "EXTRACT_LINKS";
  res: { href: string; text: string }[];
}
