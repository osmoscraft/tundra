import type { RouteHandler } from "./lib/messaging/proxy-server";
export type AppRoutes = {
  createWorkspaceNode: RouteHandler<CreateWorkspaceNodeInput, CreateWorkspaceNodeOutput>;
  listWorkspaceNodes: RouteHandler<undefined, ListWorkspaceNodesOutput>;
  commitWorkspaceNodes: RouteHandler<undefined, CommitWorkspaceNodesOutput>;
  listRepoNodes: RouteHandler<undefined, ListRepoNodesOutput>;
};

// createWorkspaceNode
export interface CreateWorkspaceNodeInput {
  id: string;
  content: string;
}
export interface CreateWorkspaceNodeOutput {
  id: string;
}

// listWorkspaceNodes
export interface ListWorkspaceNodesOutput {
  nodes: WorkspaceNode[];
}
export interface WorkspaceNode {
  id: string;
  content: string;
}

// commitWorkspaceNodes
export interface CommitWorkspaceNodesOutput {
  changeCount: number;
}

// listRepoNodes
export interface ListRepoNodesOutput {
  nodes: RepoNode[];
}
export interface RepoNode {
  id: string;
  content: string;
}
