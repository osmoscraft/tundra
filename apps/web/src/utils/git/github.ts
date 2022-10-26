export interface GitHubContext {
  owner: string;
  repo: string;
  token: string;
}

export interface Branch {
  commit: {
    sha: string;
  };
  name: string;
}

const btoa = (globalThis as any as Window).btoa; // Worker environment does not have Window but btoa still exists on global scope

export async function getDefaultBranch(context: GitHubContext): Promise<Branch> {
  const { repo, owner, token } = context;
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
    headers: new Headers({
      Authorization: "Basic " + btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
  });

  const branches = (await response.json()) as any[];
  if (branches?.length) {
    return branches[0];
  }
  throw new Error("No branch found");
}

export interface UpdateRefInput {
  ref: string;
  sha: string;
  force?: boolean;
}

export interface Ref {
  ref: string;
  object: {
    type: ObjectType;
    sha: string;
  };
}

export async function updateRef(context: GitHubContext, input: UpdateRefInput): Promise<Ref> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/${input.ref}`, {
    headers: new Headers({
      Authorization: "Basic " + btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
    method: "PATCH",
    body: JSON.stringify({
      sha: input.sha,
      force: input.force,
    }),
  });

  return await response.json();
}

export interface ListCommitsInput {
  path?: string;
}

export interface CommitListItem {
  sha: string;
}

export async function listCommits(context: GitHubContext, input?: ListCommitsInput): Promise<CommitListItem[]> {
  const { token, owner, repo } = context;

  const searchParams = new URLSearchParams({
    t: Date.now().toString(), // bust cache
  });
  input?.path && searchParams.set("path", input.path);

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?${searchParams}`, {
    headers: new Headers({
      Authorization: "Basic " + btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
  });

  return await response.json();
}

// ref: https://docs.github.com/en/rest/git/commits#get-a-commit
export interface GetCommitInput {
  sha: string;
}

export interface Commit {
  sha: string;
  tree: {
    sha: string;
  };
}

export async function getCommit(context: GitHubContext, input: GetCommitInput): Promise<Commit> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${input.sha}`, {
    headers: new Headers({
      Authorization: "Basic " + btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
  });

  return await response.json();
}

export interface CreateCommitInput {
  message: string;
  tree: string;
  parents: string[];
}

export async function createCommit(context: GitHubContext, input: CreateCommitInput): Promise<Commit> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    headers: new Headers({
      Authorization: "Basic " + btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
    method: "POST",
    body: JSON.stringify({
      message: input.message,
      tree: input.tree,
      parents: input.parents,
    }),
  });

  return await response.json();
}

export interface GetTreeInput {
  sha: string;
}
export interface Tree {
  sha: string;
  tree: {
    path: string;
    sha: string;
    type: string;
    mode: string;
  }[];
}

export async function getTree(context: GitHubContext, input: GetTreeInput): Promise<Tree> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${input.sha}`, {
    headers: new Headers({
      Authorization: "Basic " + btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
  });

  return await response.json();
}

export interface CreateTreeInput {
  base_tree?: string;
  tree: {
    path: string;
    mode: ObjectMode;
    type: ObjectType;
    sha?: string | null;
    content?: string;
  }[];
}

export async function createTree(context: GitHubContext, input: CreateTreeInput): Promise<Tree> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    headers: new Headers({
      Authorization: "Basic " + btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
    method: "POST",
    body: JSON.stringify({
      base_tree: input.base_tree,
      tree: input.tree,
    }),
  });

  return await response.json();
}

export interface GetBlobInput {
  sha: string;
}

export interface GitHubBlob {
  content: string;
}
export async function getBlob(context: GitHubContext, input: GetBlobInput): Promise<GitHubBlob> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${input.sha}`, {
    headers: new Headers({
      Authorization: "Basic " + btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
  });

  return await response.json();
}

export interface CompareInput {
  base: string;
  head: string;
}

export interface CompareResult {
  status: string;
  ahead_by: number;
  behind_by: number;
  files: CompareResultFile[];
}

export interface CompareResultFile {
  sha: string;
  filename: string;
  status: GitDiffStatus;
}

export type GitDiffStatus = "added" | "removed" | "modified" | "renamed" | "copied" | "changed" | "unchanged";

export async function compare(context: GitHubContext, input: CompareInput): Promise<CompareResult> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/compare/${input.base}...${input.head}`, {
    headers: new Headers({
      Authorization: "Basic " + btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
  });

  return await response.json();
}

export const enum ObjectMode {
  File = "100644",
  Executable = "100755",
  Sudirectory = "040000",
  Submodule = "160000",
  Symlink = "120000",
}

export const enum ObjectType {
  Blob = "blob",
  Tree = "tree",
  Commit = "commit",
}
