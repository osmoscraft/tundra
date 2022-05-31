import type { RequestHandler } from "../../lib/worker-ipc/proxy-server";
import { tempRepoName } from "../services/config";
import type { ProxyServerContext } from "../worker";

export interface GetNodesInput {
  limit?: number;
}
export interface GetNodesOutput {
  nodes: any[];
}

export const handleGetNodes: RequestHandler<GetNodesInput, GetNodesOutput, ProxyServerContext> = async ({ input, context }) => {
  const files = await context.fileSystem.listFiles(tempRepoName);
  // FIXME this won't work with dynamic media type
  const nodes = files.map((file) => JSON.parse(file));

  return {
    nodes,
  };
};
