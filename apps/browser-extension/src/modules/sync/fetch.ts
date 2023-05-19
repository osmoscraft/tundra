import { applyPatch, parsePatch } from "diff";
import { getConnection, getGithubRef } from ".";
import DELETE_FILE from "../file-system/sql/delete-file.sql";
import SELECT_FILE from "../file-system/sql/select-file.sql";
import UPSERT_FILE from "../file-system/sql/upsert-file.sql";
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
  const connection = await getConnection(syncDb);
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

export async function getChangedFileContent(connection: GithubConnection, fsDb: Sqlite3.DB, file: CompareResultFile) {
  if (file.status === "removed") return null;

  const localContent =
    fsDb.selectObject<{ path: string; content: string }>(SELECT_FILE, {
      ":path": file.filename,
    })?.content ?? "";

  const parsedPatches = file.patch ? parsePatch(file.patch) : null;

  const latestContent = parsedPatches
    ? applyPatch(localContent, parsedPatches[0])
    : b64DecodeUnicode((await getBlob(connection!, { sha: file.sha })).content);

  return latestContent;
}

export async function mergeChangedFile(fsDb: Sqlite3.DB, path: string, content: string | null) {
  if (content === null) {
    fsDb.exec(DELETE_FILE, {
      bind: {
        ":path": path,
      },
    });
    console.log("[merge] delete", path);
  } else {
    fsDb.exec(UPSERT_FILE, {
      bind: {
        ":path": path,
        ":type": "text/plain",
        ":content": content,
      },
    });
    console.log("[merge] change", path);
  }
}
