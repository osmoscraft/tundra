import { getConnection } from ".";
import * as github from "./github";
import { githubPathToLocalPath, zipPathToGitHubFilePath } from "./path";
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

  for await (const item of itemsGenerator) {
    const githubPath = zipPathToGitHubFilePath(item.path);
    yield { path: githubPath, timestamp: now, status: RemoteChangeStatus.Added, readText: () => item.readAsText() };
  }
}

export async function* importGithubArchive(zipballUrl: string): AsyncGenerator<GitHubItem> {
  const itemsGenerator = github.downloadZip(zipballUrl);

  performance.mark("import-start");
  for await (const item of itemsGenerator) {
    const githubPath = zipPathToGitHubFilePath(item.path);
    const localPath = githubPathToLocalPath(githubPath);
    if (!localPath) {
      console.log(`[import] skip ${githubPath}`);
    } else {
      const content = await item.readAsText();
      console.log(`[import] accept ${localPath} (size: ${content.length})`);
      yield { path: localPath, content };
    }
  }
  console.log("[perf] import", performance.measure("import duration", "import-start").duration);
}
