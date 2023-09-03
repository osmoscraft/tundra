import type { GithubConnection } from "../github-config";
import ARCHIVE_URL from "../queries/archive-url.graphql";
import { apiV4, unwrap } from "./api-connection";

export interface ArchiveUrlOutput {
  repository: {
    defaultBranchRef: {
      target: {
        oid: string;
        tarballUrl: string;
        zipballUrl: string;
      };
    };
  };
}
export interface ArhicveUrlVariables {
  owner: string;
  repo: string;
}

export interface GetArchiveOutput {
  oid: string;
  tarballUrl: string;
  zipballUrl: string;
}
export async function getArchive(connection: GithubConnection): Promise<GetArchiveOutput> {
  const response = await apiV4<ArhicveUrlVariables, ArchiveUrlOutput>(connection, ARCHIVE_URL, connection);
  const data = unwrap(response);
  return data.repository.defaultBranchRef.target;
}
