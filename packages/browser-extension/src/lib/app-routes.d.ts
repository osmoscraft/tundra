import type { BaseProxySchema, RouteHandler } from "./messaging/proxy-server";
export interface AppRoutes extends BaseProxySchema {
  "create-node": RouteHandler<CreateNodeInput, CreateNodeOutput>;
  "get-nodes": RouteHandler<GetNodesInput, GetNodesOutput>;
}

export interface CreateNodeInput {
  mediaType: "application/json";
  content: string;
}

export interface CreateNodeOutput {
  id: string;
}

export interface GetNodesInput {
  limit?: number;
}
export interface GetNodesOutput {
  nodes: GraphNode[];
}
