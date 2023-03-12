import { HttpReader, TextWriter, ZipReader } from "@zip.js/zip.js";
import { apiV3, apiV4, getGitHubInit, unwrap } from "./api-proxy";
import type { GithubConnection } from "./config-storage";
import ARCHIVE_URL from "./queries/archive-url.graphql";
import HEAD_REF from "./queries/head-ref.graphql";
import ROOT_TREE from "./queries/root-tree.graphql";
import TEST_CONNECTION from "./queries/test-connection.graphql";

export interface TestConnectionOutput {
  viewer: {
    login: string;
  };
}
export async function testConnection(connection: GithubConnection) {
  try {
    const response = await apiV4<undefined, TestConnectionOutput>(connection, TEST_CONNECTION);
    const data = unwrap(response);
    const login = data.viewer.login;
    console.log(`Successfully logged in as "${login}"`);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export interface ArchiveUrlOutput {
  repository: {
    defaultBranchRef: {
      target: {
        oid: string;
        tarballUrl: string;
        zipballUrl: string;
      };
    };
  };
}
export interface ArhicveUrlVariables {
  owner: string;
  repo: string;
}
export async function download(
  connection: GithubConnection,
  onItem: (path: string, getContent: () => Promise<string>) => any,
  onComplete: (commitSha: string) => any
): Promise<{ oid: string }> {
  const response = await apiV4<ArhicveUrlVariables, ArchiveUrlOutput>(connection, ARCHIVE_URL, connection);
  const data = unwrap(response);
  const url = data.repository.defaultBranchRef.target.zipballUrl;
  const oid = data.repository.defaultBranchRef.target.oid;
  console.log(`Found zipball ${url}`);

  const zipReader = new ZipReader(new HttpReader(url));
  const entriesGen = await zipReader.getEntriesGenerator();

  performance.mark("decompression-start");

  for await (const entry of entriesGen) {
    const textWriter = new TextWriter();
    await onItem(entry.filename, () => entry.getData(textWriter));
  }

  await onComplete(oid);

  await zipReader.close();
  console.log("decompression", performance.measure("decompression", "decompression-start").duration);

  return { oid };
}

export interface HeadRefVariables {
  owner: string;
  repo: string;
}

export interface HeadRefOutput {
  repository: {
    defaultBranchRef: {
      target: {
        oid: string;
      };
    };
  };
}

export async function getRemoteHeadRef(connection: GithubConnection) {
  const response = await apiV4<HeadRefVariables, HeadRefOutput>(connection, HEAD_REF, connection);
  return response.data.repository.defaultBranchRef.target.oid;
}

export interface RootTreeVariables {
  owner: string;
  repo: string;
}

export interface RootTreeOutput {
  repository: {
    defaultBranchRef: {
      name: string;
      target: {
        oid: string;
        tree: {
          oid: string;
        };
      };
    };
  };
}

export async function getRootTree(connection: GithubConnection) {
  const response = await apiV4<RootTreeVariables, RootTreeOutput>(connection, ROOT_TREE, connection);
  return {
    defaultBranch: response.data.repository.defaultBranchRef.name,
    rootCommit: response.data.repository.defaultBranchRef.target.oid,
    rootTreeSha: response.data.repository.defaultBranchRef.target.tree.oid,
  };
}

export interface FileChange {
  path: string;
  content: string;
}

export interface UpdateContentResult {
  content: {
    name: string;
    path: string;
    sha: string;
  };
  commit: {
    sha: string;
  };
}

export async function updateContent(
  connection: GithubConnection,
  fileChange: FileChange
): Promise<UpdateContentResult> {
  const update = await apiV3<UpdateContentResult>(
    {
      ...getGitHubInit(connection),
      method: "PUT",
      body: JSON.stringify({
        message: "tinykb update",
        content: self.btoa(fileChange.content),
      }),
    },
    `https://api.github.com/repos/${connection.owner}/${connection.repo}/contents/${fileChange.path}`
  );

  return update;
}

export interface DraftNode {
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
export async function pushBulk(connection: GithubConnection, drafts: DraftNode[]): Promise<PushResult | null> {
  if (!drafts.length) {
    console.log(`[push] nothing to push`);
    return null;
  }

  const updateItems = drafts.filter((draft) => [ChangeType.Create, ChangeType.Update].includes(draft.changeType));
  const deleteItems = drafts.filter((draft) => ChangeType.Delete === draft.changeType);

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

export async function createTree(context: GithubConnection, input: CreateTreeInput): Promise<Tree> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    headers: new Headers({
      Authorization: "Basic " + self.btoa(`${owner}:${token}`),
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

export interface CreateCommitInput {
  message: string;
  tree: string;
  parents: string[];
}

export async function createCommit(context: GithubConnection, input: CreateCommitInput): Promise<Commit> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    headers: new Headers({
      Authorization: "Basic " + self.btoa(`${owner}:${token}`),
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

export async function updateRef(context: GithubConnection, input: UpdateRefInput): Promise<Ref> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/${input.ref}`, {
    headers: new Headers({
      Authorization: "Basic " + self.btoa(`${owner}:${token}`),
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

export interface Commit {
  sha: string;
  tree: {
    sha: string;
  };
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
