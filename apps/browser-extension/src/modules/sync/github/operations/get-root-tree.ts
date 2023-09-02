import type { GithubConnection } from "..";
import { apiV4 } from "../proxy/api-connection";
import ROOT_TREE from "../queries/root-tree.graphql";

export interface RootTreeVariables {
  owner: string;
  repo: string;
}

export interface RootTreeOutput {
  repository: {
    defaultBranchRef: null | {
      name: string;
      target: {
        oid: string;
        tree: {
          oid: string;
        };
      };
    };
  };
}

export interface RootTree {
  defaultBranch: string;
  rootCommit: string;
  rootTreeSha: string;
}

export async function getRootTree(connection: GithubConnection): Promise<RootTree | null> {
  const response = await apiV4<RootTreeVariables, RootTreeOutput>(connection, ROOT_TREE, connection);

  if (!response.data.repository.defaultBranchRef) return null;

  return {
    defaultBranch: response.data.repository.defaultBranchRef.name,
    rootCommit: response.data.repository.defaultBranchRef.target.oid,
    rootTreeSha: response.data.repository.defaultBranchRef.target.tree.oid,
  };
}
