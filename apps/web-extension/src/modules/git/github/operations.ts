import { apiV4, unwrap } from "./api-proxy";
import ARCHIVE_URL from "./queries/archive-url.graphql";
import TEST_CONNECTION from "./queries/test-connection.graphql";

export interface GitHubConnection {
  owner: string;
  repo: string;
  token: string;
}

export interface TestConnection {
  viewer: {
    login: string;
  };
}
export async function testConnection(connection: GitHubConnection) {
  const response = await apiV4<undefined, TestConnection>(connection, TEST_CONNECTION);
  const data = unwrap(response);
  const login = data.viewer.login;
  console.log(`Successfully logged in as "${login}"`);
  return true;
}

export interface ArchiveUrl {
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
export async function download(connection: GitHubConnection): Promise<{ oid: string; blob: Blob }> {
  const response = await apiV4<ArhicveUrlVariables, ArchiveUrl>(connection, ARCHIVE_URL, connection);
  const data = unwrap(response);
  const url = data.repository.defaultBranchRef.target.zipballUrl;
  const oid = data.repository.defaultBranchRef.target.oid;
  console.log(`Found tarball ${url}`);

  const blob = await fetch(url).then((response) => response.blob());

  return { blob, oid };
}
