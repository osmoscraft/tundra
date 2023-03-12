import type { GithubConnection } from "../config-storage";

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

export async function compare(connection: GithubConnection, input: CompareInput): Promise<CompareResult> {
  const { token, owner, repo } = connection;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/compare/${input.base}...${input.head}`, {
    headers: new Headers({
      Authorization: "Basic " + self.btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
  });

  return await response.json();
}
