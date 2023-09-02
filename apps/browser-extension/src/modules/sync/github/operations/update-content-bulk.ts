import type { GithubConnection } from "..";
import { DbFileAction, type DbReadableFile } from "../../../database/schema";
import { createCommit } from "./create-commit";
import { createTree } from "./create-tree";
import { getRootTree } from "./get-root-tree";
import { ObjectMode, ObjectType } from "./types";
import { updateRef } from "./update-ref";

export interface PushResult {
  commitSha: string;
}
export async function updateContentBulk(
  connection: GithubConnection,
  fileChanges: DbReadableFile[]
): Promise<PushResult> {
  const updateItems = fileChanges.filter((draft) =>
    [DbFileAction.Add, DbFileAction.Modify].includes(draft.localAction)
  );
  const deleteItems = fileChanges.filter((draft) => DbFileAction.Remove === draft.localAction);

  console.log(`[push]`, { updateItems, deleteItems });

  const rootTree = await getRootTree(connection);
  if (!rootTree) {
    throw new Error("Remote repository is not initialized");
  }

  const { defaultBranch, rootCommit, rootTreeSha } = rootTree;

  if (!fileChanges.length) {
    return {
      commitSha: rootCommit,
    };
  }

  const rootTreePatch = [
    ...updateItems.map((item) => ({
      path: item.path,
      mode: ObjectMode.File,
      type: ObjectType.Blob,
      content: item.content!, // null only when deleting
    })),
    ...deleteItems.map((item) => ({
      path: item.path,
      mode: ObjectMode.File,
      type: ObjectType.Blob,
      sha: null,
    })),
  ];

  const updatedRootTree = await createTree(connection, {
    base_tree: rootTreeSha,
    tree: rootTreePatch,
  });

  console.log(`[push] root tree updated`, updatedRootTree.sha);

  const updatedCommit = await createCommit(connection, {
    message: "update",
    tree: updatedRootTree.sha,
    parents: [rootCommit],
  });

  console.log(`[push] commit created`, updatedCommit.sha);

  const updatedRef = await updateRef(connection, {
    ref: `refs/heads/${defaultBranch}`,
    sha: updatedCommit.sha,
  });

  console.log(`[push] ref updateds`, updatedRef);
  return {
    commitSha: updatedCommit.sha,
  };
}
