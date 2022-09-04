import { DBSchema, openDB } from "idb";
import { b64DecodeUnicode } from "../utils/base64";
import { ensure } from "../utils/ensure";
import { filePathToId } from "../utils/id";
import { compare, CompareResultFile, getBlob, getCommit, getDefaultBranch, getGitHubContext, getTree, GitHubContext, listCommits } from "./github";

export interface SyncStoreSchema extends DBSchema {
  change: {
    value: ChangeSchema;
    key: string;
    indexes: {
      byStatus: string;
    };
  };
  history: {
    value: HistoryItemSchema;
    key: string;
  };
}

export interface ChangeSchema {
  id: string;
  status: ChangeStatus;
}

export enum ChangeStatus {
  Clean = 0,
  Create = 1,
  Update = 2,
  Delete = 3,
}

export interface HistoryItemSchema {
  syncedOn: Date;
  commit: string;
}

export function openFileStore() {
  return openDB<SyncStoreSchema>("tkb-sync-db", 1, {
    upgrade(db, _oldVersion, _newVersion, _transaction) {
      const fileStore = db.createObjectStore("change", {
        keyPath: "id",
      });

      fileStore.createIndex("byStatus", "status");

      db.createObjectStore("history", { autoIncrement: true });
    },
  });
}

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

export async function getRemoteAll() {
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
  console.log(`[get-remote-all]`, changes);

  return changes;
}

async function compareResultFileToChange(context: GitHubContext, file: CompareResultFile) {
  return {
    status: file.status,
    filename: file.filename,
    id: filePathToId(file.filename),
    content: file.status === "removed" ? "" : b64DecodeUnicode((await getBlob(context, { sha: file.sha })).content),
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
