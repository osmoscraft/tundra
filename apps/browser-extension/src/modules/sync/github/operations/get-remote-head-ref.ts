import type { GithubConnection } from "..";
import { apiV4 } from "../proxy/api-connection";
import HEAD_REF from "../queries/head-ref.graphql";

export interface HeadRefVariables {
  owner: string;
  repo: string;
}

export interface HeadRefOutput {
  repository: {
    defaultBranchRef: {
      target: {
        oid: string;
      };
    };
  };
}

export async function getRemoteHeadRef(connection: GithubConnection) {
  const response = await apiV4<HeadRefVariables, HeadRefOutput>(connection, HEAD_REF, connection);
  return response.data.repository.defaultBranchRef.target.oid;
}
