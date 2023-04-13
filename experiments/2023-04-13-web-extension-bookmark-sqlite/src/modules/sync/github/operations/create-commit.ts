import type { GithubConnection } from "../config-storage";
import type { Commit } from "./types";

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
