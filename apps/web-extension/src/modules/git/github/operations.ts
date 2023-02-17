import { apiV4, unwrap } from "./api-proxy";
import TARBALL_URL from "./queries/tarball-url.graphql";
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

export interface TarballUrl {
  repository: {
    defaultBranchRef: {
      target: {
        oid: string;
        tarballUrl: string;
      };
    };
  };
}
export interface TarballUrlVariables {
  owner: string;
  repo: string;
}
export async function download(connection: GitHubConnection): Promise<{ oid: string; blob: Blob }> {
  const response = await apiV4<TarballUrlVariables, TarballUrl>(connection, TARBALL_URL, connection);
  const data = unwrap(response);
  const url = data.repository.defaultBranchRef.target.tarballUrl;
  const oid = data.repository.defaultBranchRef.target.oid;
  console.log(`Found tarball ${url}`);

  const blob = await fetch(url)
    .then((response) => response.body!.pipeThrough(new (globalThis as any).DecompressionStream("gzip")))
    .then((decompressedStream) => new Response(decompressedStream).blob());

  return { blob, oid };
}
