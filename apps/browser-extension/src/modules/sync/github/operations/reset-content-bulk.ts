import type { GithubConnection } from "..";
import type { DbReadableFile } from "../../../database/schema";
import { createCommit } from "./create-commit";
import { createTree } from "./create-tree";
import { ensureRepo } from "./ensure-repo";
import { getRootTree } from "./get-root-tree";
import { ObjectMode, ObjectType } from "./types";
import { updateRef } from "./update-ref";

export interface PushResult {
  commitSha: string;
}

export async function resetContentBulk(connection: GithubConnection, files: DbReadableFile[]): Promise<PushResult> {
  console.log(`[reset]`, { files });

  const contentFiles = files.filter((file) => file.content !== null);

  if (!contentFiles.length) {
    throw new Error("Local repo is empty");
  }

  const { commitSha } = await ensureRepo(connection);
  console.log(`[reset] repo commit ensured: ${commitSha}`);

  const tree = await getRootTree(connection);
  if (!tree) throw new Error("Error initializing remote repository");

  const defaultBranchRef = tree.defaultBranch;

  const rootTreePatch = [
    ...contentFiles.map((file) => ({
      path: file.path,
      mode: ObjectMode.File,
      type: ObjectType.Blob,
      content: file.content!,
    })),
  ];

  const updatedRootTree = await createTree(connection, {
    tree: rootTreePatch,
  });

  console.log(`[reset] root tree created`, updatedRootTree.sha);

  const updatedCommit = await createCommit(connection, {
    message: "init",
    tree: updatedRootTree.sha,
    parents: [],
  });

  console.log(`[reset] commit created`, updatedCommit.sha);

  const updatedRef = await updateRef(connection, {
    ref: `refs/heads/${defaultBranchRef}`,
    sha: updatedCommit.sha,
    force: true, // force is required to initialize the repo. Ref: https://stackoverflow.com/questions/10790088/github-v3-api-how-do-i-create-the-initial-commit-in-a-repository
  });

  console.log(`[reset] ref updateds`, updatedRef);
  return {
    commitSha: updatedCommit.sha,
  };
}
