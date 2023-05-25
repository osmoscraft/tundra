import { filterGeneratorAsync } from "@tinykb/fp-utils";
import { getConnection, getGithubRef } from ".";
import type { GithubConnection } from "./github";
import { compare, type CompareResultFile, type GitDiffStatus } from "./github/operations/compare";
import { getRemoteHeadRef } from "./github/operations/get-remote-head-ref";
import { listDeletedFilesByPaths } from "./github/proxy/list-deleted-files-by-paths";
import { listFilesByPaths } from "./github/proxy/list-files-by-paths";
import { RemoteChangeStatus, isMarkdownFile, type RemoteChangeRecord } from "./remote-change-record";

export interface GitHubRemoteChanges {
  generator: AsyncGenerator<RemoteChangeRecord>;
  remoteHeadRefId: string;
}
export async function getGitHubRemoteChanges(syncDb: Sqlite3.DB): Promise<GitHubRemoteChanges> {
  const { connection, localHeadRefId, remoteHeadRefId } = await ensureFetchParameters(syncDb);

  const generator = filterGeneratorAsync(
    isMarkdownFile,
    iterateGitHubDiffs(connection, localHeadRefId, remoteHeadRefId)
  );

  return { generator, remoteHeadRefId };
}

interface FetchParameters {
  connection: GithubConnection;
  localHeadRefId: string;
  remoteHeadRefId: string;
}
async function ensureFetchParameters(syncDb: Sqlite3.DB): Promise<FetchParameters> {
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

async function* iterateGitHubDiffs(
  connection: GithubConnection,
  localHeadRefId: string,
  remoteHeadRefId: string
): AsyncGenerator<RemoteChangeRecord> {
  if (remoteHeadRefId === localHeadRefId) {
    return;
  }

  // TODO handle comparison with 100+ files
  const comparisons = (await compare(connection, { base: localHeadRefId, head: remoteHeadRefId })).files;
  const sortedFileChanges = comparisons.reduce(
    (acc, file) => {
      if (file.status === "removed") {
        acc.deletedPaths.push(file.filename);
      } else {
        acc.changedPaths.push(file.filename);
      }
      return acc;
    },
    { changedPaths: [], deletedPaths: [] } as { changedPaths: string[]; deletedPaths: string[] }
  );

  const deletedFilesAsync = listDeletedFilesByPaths(connection, sortedFileChanges.deletedPaths);
  const changedFilesAsync = listFilesByPaths(connection, sortedFileChanges.changedPaths);
  const allPaths = [...sortedFileChanges.deletedPaths, ...sortedFileChanges.changedPaths];

  const readFileAtIndex = async (index: number) => {
    return index < sortedFileChanges.deletedPaths.length
      ? (await deletedFilesAsync).files[index]
      : (await changedFilesAsync).files[index - sortedFileChanges.deletedPaths.length];
  };

  for (let i = 0; i < allPaths.length; i++) {
    yield {
      path: allPaths[i],
      status: gitDiffStatusToRemoteChangeStatus(comparisons[i].status),
      readTimestamp: async () => (await readFileAtIndex(i)).committedDate,
      readText: async () => (await readFileAtIndex(i)).content,
    };
  }
}

function gitDiffStatusToRemoteChangeStatus(gitDiffStatus: GitDiffStatus): RemoteChangeStatus {
  switch (gitDiffStatus) {
    case "removed":
      return RemoteChangeStatus.Removed;
    case "added":
    case "changed":
    case "modified":
      return RemoteChangeStatus.Modified;
    default:
      throw new Error(`Unknown supported git diff status: ${gitDiffStatus}`);
  }
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
