import { getChunkReducer, reduceGenerator } from "@tinykb/fp-utils";
import { getConnection } from ".";
import type { FileChange, NodeChange } from "../database";
import { parseDocument } from "../search/indexer";
import * as github from "./github";
import { archivePathToGithubFilePath, githubPathToNotePath } from "./path";
import { RemoteChangeStatus, type RemoteChangeRecord } from "./remote-change-record";

export function GithubChangeToFileChange(record: RemoteChangeRecord): FileChange {
  const document = parseDocument(record.text ?? "");
  return {
    path: record.path,
    content: record.text,
    updatedTime: record.timestamp,
    meta: {
      title: document.frontmatter.title,
    },
  };
}

export function GithubChangeToNodeChange(record: RemoteChangeRecord): NodeChange {
  const document = parseDocument(record.text ?? "");
  return {
    path: record.path,
    title: document.frontmatter.title,
  };
}

export async function collectGithubRemoteToChunks(
  chunkSize: number,
  generator: AsyncGenerator<RemoteChangeRecord>
): Promise<RemoteChangeRecord[][]> {
  const chunkReducer = getChunkReducer(chunkSize);
  performance.mark("iterator-start");
  const chunks = await reduceGenerator(chunkReducer, [] as RemoteChangeRecord[][], generator);
  console.log(
    `[perf] collect files into ${chunks.length} chunks of size ${chunkSize}: ${
      performance.measure("iterator", "iterator-start").duration
    }ms`
  );

  return chunks;
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
