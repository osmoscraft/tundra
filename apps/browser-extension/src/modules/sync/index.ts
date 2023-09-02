// import { commit, getFile } from "../database";
import * as graphApi from "../database/graph";
import type { GithubConnection } from "./github";
import * as github from "./github";

export * from "./clone";
export * from "./fetch";
export type { GithubConnection } from "./github";
export * from "./ignore";
export * from "./push";

export function getConnection(db: Sqlite3.DB) {
  const raw = graphApi.getFile(db, "config/sync/github.json");
  return raw?.content ? (JSON.parse(raw.content) as GithubConnection) : undefined;
}

export function getGithubRemoteHeadCommit(db: Sqlite3.DB) {
  return graphApi.getFile(db, "config/sync/github-head-commit.txt")?.content ?? undefined;
}

export async function setConnection(db: Sqlite3.DB, connection: GithubConnection) {
  const path = "config/sync/github.json";
  const content = JSON.stringify(connection);

  graphApi.commit(db, {
    path,
    content,
  });
}

export function setGithubRemoteHeadCommit(db: Sqlite3.DB, commit: string | null) {
  graphApi.commit(db, {
    path: "config/sync/github-head-commit.txt",
    content: commit,
  });
}

export async function testConnection(db: Sqlite3.DB) {
  const connection = await getConnection(db);
  return !!connection && github.testConnection(connection);
}
