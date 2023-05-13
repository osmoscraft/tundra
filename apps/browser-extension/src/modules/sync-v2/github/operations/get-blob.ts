import type { GithubConnection } from "..";

export interface GetBlobInput {
  sha: string;
}

export interface GitHubBlob {
  content: string;
}
export async function getBlob(context: GithubConnection, input: GetBlobInput): Promise<GitHubBlob> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${input.sha}`, {
    headers: new Headers({
      Authorization: "Basic " + btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
  });

  return await response.json();
}
