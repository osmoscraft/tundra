import type { GithubConnection } from "..";
import type { ObjectMode, ObjectType, Tree } from "./types";

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
