import type { GithubConnection } from "../config-storage";
import { apiV4 } from "../proxy/api-connection";
import ROOT_TREE from "../queries/root-tree.graphql";

export interface RootTreeVariables {
  owner: string;
  repo: string;
}

export interface RootTreeOutput {
  repository: {
    defaultBranchRef: {
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

export async function getRootTree(connection: GithubConnection) {
  const response = await apiV4<RootTreeVariables, RootTreeOutput>(connection, ROOT_TREE, connection);
  return {
    defaultBranch: response.data.repository.defaultBranchRef.name,
    rootCommit: response.data.repository.defaultBranchRef.target.oid,
    rootTreeSha: response.data.repository.defaultBranchRef.target.tree.oid,
  };
}
