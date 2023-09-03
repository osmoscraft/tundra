import type { GithubConnection } from "..";
import { b64EncodeUnicode } from "../base64";
import { apiV3 } from "../proxy/api-connection";

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
    connection,
    `/repos/${connection.owner}/${connection.repo}/contents/${fileChange.path}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: "update",
        sha: fileChange.sha,
        content: b64EncodeUnicode(fileChange.content), // This cannot handle non-ASCII characters
      }),
    }
  );

  return update;
}
