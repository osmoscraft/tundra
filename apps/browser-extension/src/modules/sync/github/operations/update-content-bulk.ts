import type { GithubConnection } from "../config-storage";
import { createCommit } from "./create-commit";
import { createTree } from "./create-tree";
import { getRootTree } from "./get-root-tree";
import { ObjectMode, ObjectType } from "./types";
import { updateRef } from "./update-ref";

export interface BulkFileChangeItem {
  path: string;
  content: string;
  changeType: ChangeType;
}

export enum ChangeType {
  Clean = 0,
  Create = 1,
  Update = 2,
  Delete = 3,
}

export interface PushResult {
  commitSha: string;
}
export async function updateContentBulk(
  connection: GithubConnection,
  fileChanges: BulkFileChangeItem[]
): Promise<PushResult | null> {
  if (!fileChanges.length) {
    console.log(`[push] nothing to push`);
    return null;
  }

  const updateItems = fileChanges.filter((draft) => [ChangeType.Create, ChangeType.Update].includes(draft.changeType));
  const deleteItems = fileChanges.filter((draft) => ChangeType.Delete === draft.changeType);

  console.log(`[push]`, { updateItems, deleteItems });

  const { defaultBranch, rootCommit, rootTreeSha } = await getRootTree(connection);

  const rootTreePatch = [
    ...updateItems.map((item) => ({
      path: item.path,
      mode: ObjectMode.File,
      type: ObjectType.Blob,
      content: item.content,
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
