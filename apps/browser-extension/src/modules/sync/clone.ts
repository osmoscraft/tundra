import { getChunkReducer, reduceGenerator } from "@tinykb/fp-utils";
import { getConnection } from ".";
import * as github from "./github";
import { archivePathToGithubFilePath, githubPathToNotePath } from "./path";
import { RemoteChangeStatus, type RemoteChangeRecord } from "./remote-change-record";

export async function batchIterateGithubRemoteItems(
  db: Sqlite3.DB,
  generator: AsyncGenerator<RemoteChangeRecord>,
  onChunk: (db: Sqlite3.DB, chunk: RemoteChangeRecord[]) => void
) {
  const chunkSize = 100;
  const chunkReducer = getChunkReducer(chunkSize);
  performance.mark("iterator-start");
  const chunks = await reduceGenerator(chunkReducer, [] as RemoteChangeRecord[][], generator);
  console.log(
    `[perf] collect files into ${chunks.length} chunks of size ${chunkSize}: ${
      performance.measure("iterator", "iterator-start").duration
    }ms`
  );

  const onChunkWithDb = onChunk.bind(null, db);
  performance.mark("chunk-processing-start");
  db.transaction(() => chunks.forEach(onChunkWithDb));
  console.log(`[perf] process files ${performance.measure("chunk-processing", "chunk-processing-start").duration}ms`);
}

export interface GithubRemote {
  generator: AsyncGenerator<RemoteChangeRecord>;
  oid: string;
}
export async function getGithubRemote(db: Sqlite3.DB): Promise<GithubRemote> {
  const { connection } = await ensureCloneParameters(db);
  const archive = await github.getArchive(connection);

  const generator = iterateGithubArchive(archive.tarballUrl);

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

async function* iterateGithubArchive(tarballUrl: string): AsyncGenerator<RemoteChangeRecord> {
  const itemsGenerator = github.downloadTarball(tarballUrl);
  const now = new Date().toISOString();

  performance.mark("clone-start");
  for await (const item of itemsGenerator) {
    const notePath = githubPathToNotePath(archivePathToGithubFilePath(item.path));
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
