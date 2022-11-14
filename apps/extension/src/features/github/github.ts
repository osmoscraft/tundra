import { errorToString, Logger } from "../log";
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
export async function testConnection(logger: Logger, connection: GitHubConnection) {
  const response = await apiV4<undefined, TestConnection>(connection, TEST_CONNECTION);
  try {
    const data = unwrap(response);
    const login = data.viewer.login;
    logger.info(`Successfully logged in as "${login}"`);
    return true;
  } catch (error) {
    logger.error(errorToString(error));
  }
}

export interface TarballUrl {
  repository: {
    defaultBranchRef: {
      target: {
        tarballUrl: string;
      };
    };
  };
}
export interface TarballUrlVariables {
  owner: string;
  repo: string;
}
export async function download(logger: Logger, connection: GitHubConnection): Promise<Blob> {
  const response = await apiV4<TarballUrlVariables, TarballUrl>(connection, TARBALL_URL, connection);
  const data = unwrap(response);
  const url = data.repository.defaultBranchRef.target.tarballUrl;
  logger.info(`Found tarball ${url}`);

  const blob = await fetch(url)
    .then((response) => response.body!.pipeThrough(new (globalThis as any).DecompressionStream("gzip")))
    .then((decompressedStream) => new Response(decompressedStream).blob());

  return blob;
}
