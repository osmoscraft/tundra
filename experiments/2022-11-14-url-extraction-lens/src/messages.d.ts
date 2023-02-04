import { NodeSchema } from "./modules/db";
import { TypedMessage } from "./utils/send";

// * -> background
export type MessageToBackground = SetLinks | CapturePage | GetMetadata;

export interface SetLinks extends TypedMessage {
  type: "SET_LINKS";
  data: { url: string; popupId?: string; links: { href: string; text: string }[] };
}

export interface GetMetadata extends TypedMessage {
  type: "GET_METADATA";
  data: { url: string };
}

export interface CapturePage extends TypedMessage {
  type: "CAPTURE_PAGE";
  data: { title: string; url: string };
}

// background -> *
export type MessageFromBackground = LinksChanged | MetadataChanged;
export interface LinksChanged extends TypedMessage {
  type: "LINKS_CHANGED";
  data: { links: Link[] };
}

export interface MetadataChanged extends TypedMessage {
  type: "METADATA_CHANGED";
  data: NodeMetadata;
}

export interface NodeMetadata {
  isCaptured: boolean;
  inNodes: NodeSchema[];
  outNodes: NodeSchema[];
  outEdges: string[];
  latentLinks: Link[];
}

export interface Link {
  href: string;
  text: string;
}

// * -> content
export type MessageToContent = ExtractLinks;
export interface ExtractLinks extends TypedMessage {
  type: "EXTRACT_LINKS";
}
