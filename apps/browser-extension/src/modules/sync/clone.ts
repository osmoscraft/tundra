import { getConnection } from ".";
import * as github from "./github";
import { archivePathToGitHubFilePath, githubPathToNotePath } from "./path";
import { RemoteChangeStatus, type RemoteChangeRecord } from "./remote-change-record";

export interface GitHubRemote {
  generator: AsyncGenerator<RemoteChangeRecord>;
  oid: string;
}
export async function getGitHubRemote(db: Sqlite3.DB): Promise<GitHubRemote> {
  const { connection } = await ensureCloneParameters(db);
  const archive = await github.getArchive(connection);

  const generator = iterateGitHubArchive(archive.tarballUrl);

  return {
    generator,
    oid: archive.oid,
  };
}

interface CloneParameters {
  connection: github.GithubConnection;
}
async function ensureCloneParameters(db: Sqlite3.DB): Promise<CloneParameters> {
  const connection = getConnection(db);
  if (!connection) throw new Error("Missing connection");

  return {
    connection,
  };
}

async function* iterateGitHubArchive(tarballUrl: string): AsyncGenerator<RemoteChangeRecord> {
  const itemsGenerator = github.downloadTarball(tarballUrl);
  const now = new Date().toISOString();

  performance.mark("clone-start");
  for await (const item of itemsGenerator) {
    const notePath = githubPathToNotePath(archivePathToGitHubFilePath(item.path));
    if (!notePath) {
      console.log(`[clone] skip path ${item.path}`);
      continue;
    }

    console.log(`[clone] path ${notePath}`);
    yield {
      path: notePath,
      timestamp: now,
      status: RemoteChangeStatus.Created,
      text: item.text,
    };
  }
  console.log("[perf] clone", performance.measure("import duration", "clone-start").duration);
}
