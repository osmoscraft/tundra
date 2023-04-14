import type { GithubConnection } from "../config-storage";
import { apiV3, getGitHubInit } from "../proxy/api-connection";

export interface GetContentResult {
  name: string;
  path: string;
  sha: string;
  content: string;
}

export async function getContent(connection: GithubConnection, path: string): Promise<GetContentResult> {
  const content = await apiV3<GetContentResult>(
    getGitHubInit(connection),
    `https://api.github.com/repos/${connection.owner}/${connection.repo}/contents/${path}`
  );

  return content;
}
