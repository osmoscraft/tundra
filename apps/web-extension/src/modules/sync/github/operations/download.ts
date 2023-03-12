import { HttpReader, TextWriter, ZipReader } from "@zip.js/zip.js";
import { apiV4, unwrap } from "../api-proxy";
import type { GithubConnection } from "../config-storage";
import ARCHIVE_URL from "./queries/archive-url.graphql";

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
  onItem: (path: string, getContent: () => Promise<string>) => any,
  onComplete: (commitSha: string) => any
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

  await onComplete(oid);

  await zipReader.close();
  console.log("decompression", performance.measure("decompression", "decompression-start").duration);

  return { oid };
}
