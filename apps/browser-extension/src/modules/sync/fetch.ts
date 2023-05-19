import { applyPatch, parsePatch } from "diff";
import { getConnection, getGithubRef, trackLocalChange, trackRemoteChange } from ".";
import type { GithubConnection } from "./github";
import { b64DecodeUnicode } from "./github/base64";
import { compare, type CompareResultFile } from "./github/operations/compare";
import { getBlob } from "./github/operations/get-blob";
import { getRemoteHeadRef } from "./github/operations/get-remote-head-ref";
import DELETE_FILE from "./sql/delete-file.sql";
import SELECT_FILE from "./sql/select-file.sql";
import UPSERT_FILE from "./sql/upsert-file.sql";

export interface FetchParameters {
  connection: GithubConnection;
  localHeadRefId: string;
  remoteHeadRefId: string;
}
export async function ensureFetchParameters(syncDb: Sqlite3.DB): Promise<FetchParameters> {
  // ensure connection
  const connection = await getConnection(syncDb);
  if (!connection) throw new Error("Missing connection");
  // fetch
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
  // ensure connection
  if (remoteHeadRefId === localHeadRefId) {
    return [];
  }

  return compare(connection, { base: localHeadRefId, head: remoteHeadRefId }).then((results) => results.files);
}

export function pullRemovedFile(fsDb: Sqlite3.DB, syncDb: Sqlite3.DB, file: CompareResultFile) {
  if (file.status !== "removed") return;
  trackRemoteChange(syncDb, file.filename, null);
  fsDb.exec(DELETE_FILE, {
    bind: {
      ":path": file.filename,
    },
  });
  console.log("delete", file.filename);
  trackLocalChange(syncDb, file.filename, null);
}

export async function pullChangedFile(
  connection: GithubConnection,
  fsDb: Sqlite3.DB,
  syncDb: Sqlite3.DB,
  file: CompareResultFile
) {
  if (file.status === "removed") return;

  const changeSummary = {
    path: file.filename,
    sha: file.sha,
    localContent:
      fsDb.selectObject<{ path: string; content: string }>(SELECT_FILE, {
        ":path": file.filename,
      })?.content ?? "",
    patch: file.patch,
    parsedPatches: file.patch ? parsePatch(file.patch) : null,
  };

  const change = {
    ...changeSummary,
    latestContent: changeSummary.parsedPatches
      ? applyPatch(changeSummary.localContent, changeSummary.parsedPatches[0])
      : b64DecodeUnicode((await getBlob(connection!, { sha: changeSummary.sha })).content),
  };

  trackRemoteChange(syncDb, change.path, change.latestContent);
  fsDb.exec(UPSERT_FILE, {
    bind: {
      ":path": change.path,
      ":type": "text/plain",
      ":content": change.latestContent,
    },
  });
  console.log("change", change.path);
  trackLocalChange(syncDb, change.path, change.latestContent);
}
