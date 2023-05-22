import { mapIteratorAsync } from "@tinykb/fp-utils";
import { getConnection, trackLocalChange } from ".";
import { writeFile } from "../file-system";
import * as github from "./github";
import { githubPathToLocalPath, zipPathToGitHubFilePath } from "./path";

export interface ImportParameters {
  connection: github.GithubConnection;
}
export async function ensureImportParameters(syncDb: Sqlite3.DB): Promise<ImportParameters> {
  const connection = getConnection(syncDb);
  if (!connection) throw new Error("Missing connection");

  return {
    connection,
  };
}

export function writeEachItemToFile(fsDb: Sqlite3.DB, syncDb: Sqlite3.DB, generator: AsyncGenerator<GitHubItem>) {
  return mapIteratorAsync(async (item) => {
    await writeFile(fsDb, item.path, "text/markdown", item.content);
    await trackLocalChange(syncDb, item.path, item.content);
  }, generator);
}

export interface GitHubItem {
  path: string;
  content: string;
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
