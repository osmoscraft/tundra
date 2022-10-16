import { b64DecodeUnicode } from "../../utils/base64";
import { filePathToId, idToFilename } from "../../utils/filename";
import { ChangeType, FrameChangeItem, type DraftFrameSchema, type FrameSchema } from "../db/types";
import {
  compare,
  CompareResultFile,
  createCommit,
  createTree,
  getBlob,
  getCommit,
  getDefaultBranch,
  getTree,
  GitDiffStatus,
  listCommits,
  ObjectMode,
  ObjectType,
  updateRef,
} from "./github/api";
import type { GitHubContext } from "./github/context";

export async function testConnection(context: GitHubContext) {
  const branch = await getDefaultBranch(context);
  console.log(`[test-connection] default branch ${branch.name}`);
  if (!branch) return;

  const commit = await getCommit(context, { sha: branch.commit.sha });
  console.log(`[test-connection] head commit tree sha ${commit.tree.sha}`);

  const rootTree = await getTree(context, { sha: commit.tree.sha });
  console.log(`[test-connection] head commit tree`, rootTree.tree);

  const framesTreeSha = rootTree.tree.find((node) => node.path === "frames")?.sha;
  if (!framesTreeSha) return;

  const framesTree = await getTree(context, { sha: framesTreeSha });
  console.log(`[test-connection]`, framesTree.tree);
  return framesTree.tree;
}

export interface RemoteAll {
  frames: FrameSchema[];
  sha: string;
}
export async function getRemoteAll(context: GitHubContext): Promise<RemoteAll> {
  const [base, head] = await Promise.all([getRemoteBaseCommit(context), getRemoteHeadCommit(context)]);
  if (!base || !head) throw new Error("Remote is not setup");

  const diff = await compare(context, { base: base.sha, head: head.sha });

  const frames: FrameSchema[] = await Promise.all(
    diff.files
      .filter((file) => file.filename.startsWith("frames"))
      .filter((file) => file.status === "added")
      .map(async (file) => ({
        id: filePathToId(file.filename),
        content: file.status === "removed" ? "" : b64DecodeUnicode((await getBlob(context, { sha: file.sha })).content),
        dateUpdated: new Date(),
      }))
  );

  return {
    frames,
    sha: head.sha,
  };
}

async function getRemoteBaseCommit(context: GitHubContext) {
  const baseCommit = [...(await listCommits(context, { path: ".tinykb" }))].pop();
  return baseCommit;
}

async function getRemoteHeadCommit(context: GitHubContext) {
  const headCommit = (await listCommits(context)).at(0);
  return headCommit;
}

export interface FetchResult {
  headCommit: string;
  changes: FrameChangeItem[];
}
export async function fetch(context: GitHubContext, baseCommit: string): Promise<FetchResult | null> {
  const headCommit = await getRemoteHeadCommit(context);
  if (!headCommit) return null;

  const diff = await compare(context, { base: baseCommit, head: headCommit.sha });

  const changes = await Promise.all(diff.files.filter((file) => file.filename.startsWith("frames")).map(compareResultFileToChange.bind(null, context)));
  return {
    headCommit: headCommit.sha,
    changes,
  };
}

async function compareResultFileToChange(context: GitHubContext, file: CompareResultFile): Promise<FrameChangeItem> {
  return {
    changeType: getFrameChangeTypeFromGitStatus(file.status),
    id: filePathToId(file.filename),
    content: file.status === "removed" ? "" : b64DecodeUnicode((await getBlob(context, { sha: file.sha })).content),
  };
}

function getFrameChangeTypeFromGitStatus(gitStatus: GitDiffStatus): ChangeType {
  switch (gitStatus) {
    case "added":
      return ChangeType.Create;
    case "changed":
    case "modified":
      return ChangeType.Update;
    case "removed":
      return ChangeType.Delete;
    default:
      throw new Error(`Unsupported file status: ${gitStatus}`);
  }
}

export interface PushResult {
  commitSha: string;
}
export async function push(context: GitHubContext, drafts: DraftFrameSchema[]): Promise<PushResult | null> {
  if (!drafts.length) {
    console.log(`[push] nothing to push`);
    return null;
  }

  const updateItems = drafts.filter((draft) => [ChangeType.Create, ChangeType.Update].includes(draft.changeType));
  const deleteItems = drafts.filter((draft) => ChangeType.Delete === draft.changeType);

  console.log(`[push]`, { updateItems, deleteItems });

  const branch = await getDefaultBranch(context);
  const commit = await getCommit(context, { sha: branch.commit.sha });
  const rootTree = await getTree(context, { sha: commit.tree.sha });
  const framesTreeSha = rootTree.tree.find((node) => node.path === "frames")?.sha;
  const framesTree = framesTreeSha ? await getTree(context, { sha: framesTreeSha }) : undefined;
  const framesTreePatch = [
    ...updateItems.map((item) => ({
      path: idToFilename(item.id),
      mode: ObjectMode.File,
      type: ObjectType.Blob,
      content: item.content,
    })),
    ...deleteItems.map((item) => ({
      path: idToFilename(item.id),
      mode: ObjectMode.File,
      type: ObjectType.Blob,
      sha: null,
    })),
  ];

  const updatedFramesTree = await createTree(context, {
    base_tree: framesTree?.sha,
    tree: framesTreePatch,
  });

  console.log(`[push] frames tree updated`, updatedFramesTree.sha);

  const rootTreePatch = [
    {
      path: "frames",
      mode: ObjectMode.Sudirectory,
      type: ObjectType.Tree,
      sha: updatedFramesTree.sha,
    },
  ];

  const updatedRootTree = await createTree(context, {
    base_tree: rootTree.sha,
    tree: rootTreePatch,
  });

  console.log(`[push] root tree updated`, updatedFramesTree.sha);

  const updatedCommit = await createCommit(context, {
    message: "tinykb changes",
    tree: updatedRootTree.sha,
    parents: [commit.sha],
  });

  console.log(`[push] commit created`, updatedCommit.sha);

  const updatedRef = await updateRef(context, {
    ref: `refs/heads/${branch.name}`,
    sha: updatedCommit.sha,
  });

  console.log(`[push] ref updateds`, updatedRef);
  return {
    commitSha: updatedCommit.sha,
  };
}
