import type { GithubConnection } from "..";
import { createCommit } from "./create-commit";
import { createTree } from "./create-tree";
import { getRootTree } from "./get-root-tree";
import { ObjectMode, ObjectType } from "./types";
import { updateRef } from "./update-ref";

export interface BulkFileChangeItem {
  path: string;
  content: string | null; // null when deleting
  changeType: ChangeType;
}

export enum ChangeType {
  Clean = 0,
  Add = 1,
  Modify = 2,
  Remove = 3,
}

export interface PushResult {
  commitSha: string;
}
export async function updateContentBulk(
  connection: GithubConnection,
  fileChanges: BulkFileChangeItem[]
): Promise<PushResult> {
  const updateItems = fileChanges.filter((draft) => [ChangeType.Add, ChangeType.Modify].includes(draft.changeType));
  const deleteItems = fileChanges.filter((draft) => ChangeType.Remove === draft.changeType);

  console.log(`[push]`, { updateItems, deleteItems });

  const { defaultBranch, rootCommit, rootTreeSha } = await getRootTree(connection);

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
    message: "tinykb changes",
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
