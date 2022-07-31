import type { IDBPObjectStore, IDBPTransaction } from "idb";
import { ChangeStatus, getDb, TkbSchema } from "../db/db";
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
} from "../git/github-api";
import { getGitHubContext, GitHubContext } from "../git/github-context";
import { b64DecodeUnicode } from "./base64";
import { filePathToId, idToFilename } from "./filename";
import { ensure } from "./flow-control";
import { joinByFence, splitByFence } from "./frontmatter";
import { EditorFrameHeader, getEditorHeaderFromSchemaHeader, getSchemaHeaderFromEditorHeader } from "./header";

export async function testConnection() {
  const context = ensure(await getGitHubContext());
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
}

export async function forceClone() {
  const context = ensure(await getGitHubContext());
  const [base, head] = await Promise.all([getRemoteBaseCommit(context), getRemoteHeadCommit(context)]);
  if (!base || !head) return;

  const diff = await compare(context, { base: base.sha, head: head.sha });

  const changes = await Promise.all(
    diff.files
      .filter((file) => file.filename.startsWith("frames"))
      .filter((file) => file.status === "added")
      .map(compareResultFileToChange.bind(null, context))
  );
  console.log(`[force-clone]`, changes);

  await mutateLocalDb((tx) => {
    const frameStore = tx.objectStore("frame");
    const syncStore = tx.objectStore("sync");

    frameStore.clear();
    syncStore.clear();

    changes.map(applyChange.bind(null, frameStore));

    syncStore.add({
      syncedOn: new Date(),
      commit: head.sha,
    });
  });
}

export async function pull() {
  const context = ensure(await getGitHubContext());
  const [base, head] = await Promise.all([getLocalBaseCommit(), getRemoteHeadCommit(context)]);
  if (!base || !head) return;

  const diff = await compare(context, { base, head: head.sha });

  const changes = await Promise.all(diff.files.filter((file) => file.filename.startsWith("frames")).map(compareResultFileToChange.bind(null, context)));
  console.log(`[pull]`, changes);

  if (!changes.length) return;

  await mutateLocalDb((tx) => {
    const frameStore = tx.objectStore("frame");
    const syncStore = tx.objectStore("sync");

    changes.map(applyChange.bind(null, frameStore));

    syncStore.add({
      syncedOn: new Date(),
      commit: head.sha,
    });
  });

  console.log(`[pull] DB updated`);
}

export async function push() {
  const db = await getDb();

  const prePushTx = db.transaction("frame", "readonly");
  const frameStore = prePushTx.objectStore("frame");
  const statusIndex = frameStore.index("byStatus");

  const [createItems, updateItems, deleteItems] = await Promise.all([
    statusIndex.getAll(ChangeStatus.Create),
    statusIndex.getAll(ChangeStatus.Update),
    statusIndex.getAll(ChangeStatus.Delete),
  ]);

  await prePushTx.done;

  const changes = [...createItems, ...updateItems, ...deleteItems];
  console.log(`[push]`, changes);
  if (!changes.length) return;

  const context = ensure(await getGitHubContext());
  const branch = await getDefaultBranch(context);
  const commit = await getCommit(context, { sha: branch.commit.sha });
  const rootTree = await getTree(context, { sha: commit.tree.sha });
  const framesTreeSha = rootTree.tree.find((node) => node.path === "frames")?.sha;
  const framesTree = framesTreeSha ? await getTree(context, { sha: framesTreeSha }) : undefined;
  const framesTreePatch = [
    ...[...createItems, ...updateItems].map((item) => ({
      path: idToFilename(item.id),
      mode: ObjectMode.File,
      type: ObjectType.Blob,
      content: joinByFence(JSON.stringify(getEditorHeaderFromSchemaHeader(item.header), null, 2), item.body),
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

  await mutateLocalDb(async (tx) => {
    const frameStore = tx.objectStore("frame");
    const syncStore = tx.objectStore("sync");

    changes.map((change) => {
      frameStore.put({
        ...change,
        status: ChangeStatus.Clean,
      });
    });

    syncStore.add({
      syncedOn: new Date(),
      commit: updatedCommit.sha,
    });
  });

  console.log(`[push] DB updated`);
}

async function getRemoteBaseCommit(context: GitHubContext) {
  const baseCommit = [...(await listCommits(context, { path: ".tinykb" }))].pop();
  return baseCommit;
}

async function getLocalBaseCommit() {
  let commit: string | undefined;
  const db = await getDb();
  const tx = db.transaction("sync", "readonly");
  const cursor = await tx.objectStore("sync").openCursor(null, "prev");
  if (cursor?.value.commit) {
    commit = cursor?.value.commit;
  }
  await tx.done;

  return commit;
}

async function getRemoteHeadCommit(context: GitHubContext) {
  const headCommit = (await listCommits(context)).at(0);
  return headCommit;
}

type LocalDbTransact = (tx: IDBPTransaction<TkbSchema, ("frame" | "sync")[], "readwrite">) => any;

async function mutateLocalDb(transact: LocalDbTransact) {
  const db = await getDb();
  const tx = db.transaction(["frame", "sync"], "readwrite");

  transact(tx);

  await tx.done;
}

function applyChange(
  frameStore: IDBPObjectStore<TkbSchema, "frame"[], "frame", "readwrite">,
  change: {
    id: string;
    content: string;
    status: GitDiffStatus;
  }
) {
  switch (change.status) {
    case "added":
    case "changed":
    case "modified":
      const [header, body] = splitByFence(change.content);
      const parsedHeader = JSON.parse(header) as EditorFrameHeader;
      frameStore.put({
        id: change.id,
        body,
        header: getSchemaHeaderFromEditorHeader(parsedHeader),
        status: ChangeStatus.Clean,
      });
      break;
    case "removed":
      frameStore.delete(change.id);
      break;
    default:
      console.warn("Unsupported file status", change.status);
      break;
  }
}

async function compareResultFileToChange(context: GitHubContext, file: CompareResultFile) {
  return {
    status: file.status,
    filename: file.filename,
    id: filePathToId(file.filename),
    content: file.status === "removed" ? "" : b64DecodeUnicode((await getBlob(context, { sha: file.sha })).content),
  };
}
