import type { Frame } from "../db/db";
import { compare, getBlob, listCommits } from "../git/github-api";
import { getGitHubContext, type GitHubContext } from "../git/github-context";
import { b64DecodeUnicode } from "../utils/base64";
import { filePathToId } from "../utils/filename";
import { ensure } from "../utils/flow-control";

export interface RemoteAll {
  frames: Frame[];
  sha: string;
}
export async function getRemoteAll(): Promise<RemoteAll> {
  const context = ensure(await getGitHubContext());
  const [base, head] = await Promise.all([getRemoteBaseCommit(context), getRemoteHeadCommit(context)]);
  if (!base || !head) throw new Error("Remote is not setup");

  const diff = await compare(context, { base: base.sha, head: head.sha });

  const frames: Frame[] = await Promise.all(
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
