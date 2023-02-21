import { HttpReader, TextWriter, ZipReader } from "@zip.js/zip.js";
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
export async function download(
  connection: GitHubConnection,
  onItem: (path: string, getContent: () => Promise<string>) => any
): Promise<{ oid: string }> {
  const response = await apiV4<ArhicveUrlVariables, ArchiveUrl>(connection, ARCHIVE_URL, connection);
  const data = unwrap(response);
  const url = data.repository.defaultBranchRef.target.zipballUrl;
  const oid = data.repository.defaultBranchRef.target.oid;
  console.log(`Found zipball ${url}`);

  const zipReader = new ZipReader(new HttpReader(url));
  const entriesGen = await zipReader.getEntriesGenerator();

  performance.mark("decompression-start");

  for await (const entry of entriesGen) {
    const textWriter = new TextWriter();
    await onItem(entry.filename, () => entry.getData(textWriter));
  }
  await zipReader.close();
  console.log("decompression", performance.measure("decompression", "decompression-start").duration);

  // instead of return all entries, pipe through sqlite loader
  return { oid };
}
