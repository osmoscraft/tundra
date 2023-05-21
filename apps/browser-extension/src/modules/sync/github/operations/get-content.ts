import type { GithubConnection } from "..";
import { apiV3 } from "../proxy/api-connection";

export interface GetContentResult {
  name: string;
  path: string;
  sha: string;
  content: string;
}

export async function getContent(connection: GithubConnection, path: string): Promise<GetContentResult> {
  const content = await apiV3<GetContentResult>(connection, `/${connection.owner}/${connection.repo}/contents/${path}`);

  return content;
}
