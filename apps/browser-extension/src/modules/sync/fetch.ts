import { applyPatch, parsePatch } from "diff";
import { getConnection, getGithubRef } from ".";
import { readFile } from "../file-system";
import type { GithubConnection } from "./github";
import { b64DecodeUnicode } from "./github/base64";
import { compare, type CompareResultFile } from "./github/operations/compare";
import { getBlob } from "./github/operations/get-blob";
import { getRemoteHeadRef } from "./github/operations/get-remote-head-ref";

export interface FetchParameters {
  connection: GithubConnection;
  localHeadRefId: string;
  remoteHeadRefId: string;
}
export async function ensureFetchParameters(syncDb: Sqlite3.DB): Promise<FetchParameters> {
  const connection = getConnection(syncDb);
  if (!connection) throw new Error("Missing connection");

  const localHeadRefId = getGithubRef(syncDb)?.id;
  if (!localHeadRefId) throw new Error("Local repo uninitialized");

  const remoteHeadRefId = await getRemoteHeadRef(connection);

  return {
    connection,
    localHeadRefId,
    remoteHeadRefId,
  };
}

export async function getGitHubChangedFiles(
  connection: GithubConnection,
  localHeadRefId: string,
  remoteHeadRefId: string
): Promise<CompareResultFile[]> {
  if (remoteHeadRefId === localHeadRefId) {
    return [];
  }

  return compare(connection, { base: localHeadRefId, head: remoteHeadRefId }).then((results) => results.files);
}

export async function getGitHubChangedFileContent(
  connection: GithubConnection,
  fsDb: Sqlite3.DB,
  file: CompareResultFile,
  isLocalClean: boolean
) {
  if (file.status === "removed") return null;

  // patch won't work if local file has been modified
  if (file.patch && isLocalClean) {
    const localContent = readFile(fsDb, file.filename)?.content ?? "";
    return applyPatch(localContent, parsePatch(file.patch)[0]);
  } else {
    return b64DecodeUnicode((await getBlob(connection!, { sha: file.sha })).content);
  }
}
