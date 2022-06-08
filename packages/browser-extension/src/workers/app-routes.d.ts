import type { RouteHandler } from "./lib/messaging/proxy-server";
export type AppRoutes = {
  "workspace/create-node": RouteHandler<WorkspaceCreateInput, WorkspaceCreateOutput>;
  "workspace/list-all": RouteHandler<undefined, WorkspaceListOutput>;
  "workspace/commit-all": RouteHandler<undefined, WorkspaceCommitOutput>;
  "repo/list-all": RouteHandler<undefined, RepoListOutput>;
};

// workspace/create-node
export interface WorkspaceCreateInput {
  id: string;
  content: string;
}
export interface WorkspaceCreateOutput {
  id: string;
}

// workspace/list-all
export interface WorkspaceListOutput {
  nodes: WorkspaceNode[];
}
export interface WorkspaceNode {
  id: string;
  content: string;
}

// workspace/commit-all
export interface WorkspaceCommitOutput {
  changeCount: number;
}

// repo/list-all
export interface RepoListOutput {
  nodes: RepoNode[];
}
export interface RepoNode {
  id: string;
  content: string;
}
