import { b64EncodeUnicode } from "../../../../utils/base64";
import { apiV3, getGitHubInit } from "../api-proxy";
import type { GithubConnection } from "../config-storage";

export interface FileChange {
  path: string;
  content: string;
  sha?: string; // required only for updates
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
        content: b64EncodeUnicode(fileChange.content), // This cannot handle non-ASCII characters
      }),
    },
    `https://api.github.com/repos/${connection.owner}/${connection.repo}/contents/${fileChange.path}`
  );

  return update;
}
