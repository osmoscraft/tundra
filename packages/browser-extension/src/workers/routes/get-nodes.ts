import type { RequestHandler } from "../../lib/worker-ipc/proxy-server";
import type { GraphNode } from "../services/graph";

export interface GetNodesInput {
  limit?: number;
}
export interface GetNodesOutput {
  nodes: GraphNode[];
}

export const handleGetNodes: RequestHandler<GetNodesInput, GetNodesOutput> = async ({ input }) => {
  return {
    nodes: [
      { id: "1", title: "test node 1", url: "https://bing.com" },
      { id: "2", title: "test node 2", url: "https://bing.com" },
    ],
  };
};
