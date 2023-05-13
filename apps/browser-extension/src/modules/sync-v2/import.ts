import { getConnection } from ".";
import * as github from "./github";

export interface GitHubItem {
  path: string;
  content: string;
}
export async function* importGithubArchive(db: Sqlite3.DB): AsyncGenerator<GitHubItem> {
  const connection = await getConnection(db);
  if (!connection) throw new Error("Missing connection");
  const archive = await github.getArchive(connection);
  const itemsGenerator = github.downloadZip(archive.zipballUrl);

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
