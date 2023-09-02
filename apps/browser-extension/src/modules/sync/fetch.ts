import { getConnection, getGithubRemoteHeadCommit } from ".";
import type { GithubConnection } from "./github";
import { compare, type CompareResultFile, type GitDiffStatus } from "./github/operations/compare";
import { getRemoteHeadRef } from "./github/operations/get-remote-head-ref";
import { listDeletedFilesByPaths } from "./github/proxy/list-deleted-files-by-paths";
import { listFilesByPaths } from "./github/proxy/list-files-by-paths";
import { RemoteChangeStatus, type RemoteChangeRecord } from "./remote-change-record";

export interface GitHubRemoteChanges {
  generator: AsyncGenerator<RemoteChangeRecord>;
  remoteHeadRefId: string | null;
}
export async function getGitHubRemoteChanges(db: Sqlite3.DB): Promise<GitHubRemoteChanges> {
  const { connection, localHeadRefId, remoteHeadRefId } = await getFetchParameters(db);

  if (!connection || !localHeadRefId || !remoteHeadRefId) {
    const emptyGenerator = async function* () {};
    return { generator: emptyGenerator(), remoteHeadRefId: null };
  }

  const generator = iterateGitHubDiffs(connection, localHeadRefId, remoteHeadRefId);
  return { generator, remoteHeadRefId };
}

interface FetchParameters {
  connection?: GithubConnection;
  localHeadRefId?: string;
  remoteHeadRefId?: string;
}
async function getFetchParameters(db: Sqlite3.DB): Promise<FetchParameters> {
  const connection = getConnection(db);
  const localHeadRefId = getGithubRemoteHeadCommit(db);
  const remoteHeadRefId = connection ? await getRemoteHeadRef(connection) : undefined;

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
      timestamp: (await readFileAtIndex(i)).committedDate,
      text: (await readFileAtIndex(i)).content,
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
