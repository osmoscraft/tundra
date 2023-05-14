import { getConnection, setGithubRef, trackRemoteChange } from ".";
import * as github from "./github";
import { getArchive } from "./github";

export interface GitHubItem {
  path: string;
  content: string;
}

export async function* importGithubItems(syncDb: Sqlite3.DB): AsyncGenerator<GitHubItem> {
  const connection = await getConnection(syncDb);
  if (!connection) throw new Error("Missing connection");
  const archive = await getArchive(connection);
  for await (const item of importGithubArchive(archive.zipballUrl)) {
    await trackRemoteChange(syncDb, item.path, item.content);
    yield item;
  }
  setGithubRef(syncDb, archive.oid);
}

async function* importGithubArchive(zipballUrl: string): AsyncGenerator<GitHubItem> {
  const itemsGenerator = github.downloadZip(zipballUrl);

  function parseGithubZipItemPath(zipItemPath: string): ParsedPath {
    return {
      archivePath: zipItemPath,
      localMarkdownNotePath: zipItemPath.match(/(\/notes\/.*\.md)/)?.[0],
    };
  }

  performance.mark("import-start");
  for await (const item of itemsGenerator) {
    const parsedPath = parseGithubZipItemPath(item.path);
    if (!parsedPath.localMarkdownNotePath) {
      console.log(`[import] skip ${item.path.slice(item.path.indexOf("/"))}`);
    } else {
      const content = await item.readAsText();
      console.log(`[import] accept ${parsedPath.localMarkdownNotePath} (size: ${content.length})`);
      yield { path: parsedPath.localMarkdownNotePath, content };
    }
  }
  console.log("[perf] import", performance.measure("import duration", "import-start").duration);
}

interface ParsedPath {
  archivePath: string;
  localMarkdownNotePath?: string;
}
