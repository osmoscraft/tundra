import type { GithubConnection } from "../github-config";

export interface GetBlobInput {
  sha: string;
}

export interface GithubBlob {
  content: string;
}
export async function getBlob(context: GithubConnection, input: GetBlobInput): Promise<GithubBlob> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${input.sha}`, {
    headers: new Headers({
      Authorization: "Basic " + btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
  });

  return await response.json();
}
