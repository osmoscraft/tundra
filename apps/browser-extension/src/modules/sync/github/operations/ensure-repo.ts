import type { GithubConnection } from "..";
import { getRootTree } from "./get-root-tree";
import { updateContent } from "./update-content";

export interface RepoResult {
  commitSha: string;
}

export async function ensureRepo(connection: GithubConnection): Promise<RepoResult> {
  const tree = await getRootTree(connection);
  if (tree?.rootCommit) return { commitSha: tree.rootCommit };

  // Use a dummy file to make sure the repo is initialized and a default branch is available
  const { commit } = await updateContent(connection, {
    path: ".tinykb",
    content: "",
  });

  return {
    commitSha: commit.sha,
  };
}
