import type { RouteHandler } from "./lib/messaging/proxy-server";
export type AppRoutes = {
  "create-node": RouteHandler<CreateNodeInput, CreateNodeOutput>;
  "get-nodes": RouteHandler<GetNodesInput, GetNodesOutput>;
  "get-status": RouteHandler<undefined, GetStatusOutput>;
};

export interface CreateNodeInput {
  id: string;
  content: string;
}

export interface CreateNodeOutput {
  id: string;
}

export interface GetNodesInput {
  limit?: number;
}
export interface GetNodesOutput {
  nodes: {
    id: string;
    title: string;
    url: string;
  }[];
}

export interface GetStatusOtuput {
  status: any;
}
