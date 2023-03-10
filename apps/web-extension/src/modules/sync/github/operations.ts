import { HttpReader, TextWriter, ZipReader } from "@zip.js/zip.js";
import { apiV4, unwrap } from "./api-proxy";
import type { GithubConnection } from "./config-storage";
import ARCHIVE_URL from "./queries/archive-url.graphql";
import HEAD_REF from "./queries/head-ref.graphql";
import TEST_CONNECTION from "./queries/test-connection.graphql";

export interface TestConnectionOutput {
  viewer: {
    login: string;
  };
}
export async function testConnection(connection: GithubConnection) {
  try {
    const response = await apiV4<undefined, TestConnectionOutput>(connection, TEST_CONNECTION);
    const data = unwrap(response);
    const login = data.viewer.login;
    console.log(`Successfully logged in as "${login}"`);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

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
export async function download(
  connection: GithubConnection,
  onItem: (path: string, getContent: () => Promise<string>) => any
): Promise<{ oid: string }> {
  const response = await apiV4<ArhicveUrlVariables, ArchiveUrlOutput>(connection, ARCHIVE_URL, connection);
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

  return { oid };
}

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
