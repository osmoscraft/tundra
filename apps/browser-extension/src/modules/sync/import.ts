import { mapIteratorAsync } from "@tinykb/fp-utils";
import { getConnection, setGithubRef, trackLocalChange, trackRemoteChange } from ".";
import { writeFile } from "../file-system";
import * as github from "./github";
import { getArchive } from "./github";
import { githubPathToLocalPath, zipPathToGitHubFilePath } from "./path";

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

export async function* importGithubItems(syncDb: Sqlite3.DB): AsyncGenerator<GitHubItem> {
  const connection = await getConnection(syncDb);
  if (!connection) throw new Error("Missing connection");
  const archive = await getArchive(connection);

  yield* mapIteratorAsync(trackItemRemoteChange.bind(null, syncDb), importGithubArchive(archive.zipballUrl));

  setGithubRef(syncDb, archive.oid);
}

async function trackItemRemoteChange(db: Sqlite3.DB, item: GitHubItem) {
  await trackRemoteChange(db, item.path, item.content);
  return item;
}

async function* importGithubArchive(zipballUrl: string): AsyncGenerator<GitHubItem> {
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
