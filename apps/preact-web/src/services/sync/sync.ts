import { b64DecodeUnicode } from "../../utils/base64";
import { filePathToId } from "../../utils/filename";
import type { FrameSchema } from "../db/db";
import type { FrameChangeItem } from "../db/tx";
import { compare, CompareResultFile, getBlob, getCommit, getDefaultBranch, getTree, listCommits } from "../git/github-api";
import type { GitHubContext } from "../git/github-context";

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

async function compareResultFileToChange(context: GitHubContext, file: CompareResultFile) {
  return {
    status: file.status,
    id: filePathToId(file.filename),
    content: file.status === "removed" ? "" : b64DecodeUnicode((await getBlob(context, { sha: file.sha })).content),
  };
}
