import { filterGeneratorAsync } from "@tinykb/fp-utils";
import { getConnection } from ".";
import * as github from "./github";
import { zipPathToGitHubFilePath } from "./path";
import { RemoteChangeStatus, isMarkdownFile, type RemoteChangeRecord } from "./remote-change-record";

export interface GitHubRemote {
  generator: AsyncGenerator<RemoteChangeRecord>;
  oid: string;
}
export async function getGitHubRemote(syncDb: Sqlite3.DB): Promise<GitHubRemote> {
  const { connection } = await ensureCloneParameters(syncDb);
  const archive = await github.getArchive(connection);

  const zipballItemsGenerator = iterateGitHubArchive(archive.zipballUrl);
  const generator = filterGeneratorAsync(isMarkdownFile, zipballItemsGenerator);

  return {
    generator,
    oid: archive.oid,
  };
}

interface CloneParameters {
  connection: github.GithubConnection;
}
async function ensureCloneParameters(syncDb: Sqlite3.DB): Promise<CloneParameters> {
  const connection = getConnection(syncDb);
  if (!connection) throw new Error("Missing connection");

  return {
    connection,
  };
}

async function* iterateGitHubArchive(zipballUrl: string): AsyncGenerator<RemoteChangeRecord> {
  const itemsGenerator = github.downloadZip(zipballUrl);
  const now = new Date().toISOString();

  performance.mark("clone-start");
  for await (const item of itemsGenerator) {
    const githubPath = zipPathToGitHubFilePath(item.path);
    console.log(`[clone] path ${githubPath}`);
    yield {
      path: githubPath,
      readTimestamp: () => now,
      status: RemoteChangeStatus.Created,
      readText: () => item.readAsText(),
    };
  }
  console.log("[perf] clone", performance.measure("import duration", "clone-start").duration);
}
