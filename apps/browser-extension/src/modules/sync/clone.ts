import { getConnection } from ".";
import * as github from "./github";
import { zipPathToGitHubFilePath } from "./path";
import { RemoteChangeStatus, type RemoteChangeRecord } from "./remote-change-record";

export interface CloneParameters {
  connection: github.GithubConnection;
}
export async function ensureCloneParameters(syncDb: Sqlite3.DB): Promise<CloneParameters> {
  const connection = getConnection(syncDb);
  if (!connection) throw new Error("Missing connection");

  return {
    connection,
  };
}

export interface GitHubItem {
  path: string;
  content: string;
}

export async function* iterateGitHubArchive(zipballUrl: string): AsyncGenerator<RemoteChangeRecord> {
  const itemsGenerator = github.downloadZip(zipballUrl);
  const now = new Date().toISOString();

  performance.mark("clone-start");
  for await (const item of itemsGenerator) {
    const githubPath = zipPathToGitHubFilePath(item.path);
    console.log(`[clone] path ${githubPath}`);
    yield {
      path: githubPath,
      readTimestamp: () => now,
      status: RemoteChangeStatus.Added,
      readText: () => item.readAsText(),
    };
  }
  console.log("[perf] clone", performance.measure("import duration", "import-start").duration);
}
