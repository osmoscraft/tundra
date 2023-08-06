import * as dbApi from "../database";
import { getUserIgnores } from "../sync";
import { notePathToId } from "../sync/path";

export interface SearchInput {
  query: string;
  limit: number;
}

export function searchNotes(db: Sqlite3.DB, input: SearchInput) {
  const query = consecutiveWordPrefixQuery(input.query);
  console.log(`[search] internal query ${query}`);
  const files = dbApi.searchFiles(db, {
    query,
    limit: input.limit,
    paths: ["data/notes*"],
    ignore: getUserIgnores(db),
  });
  return files;
}

export interface SearchBacklinkInput {
  path: string;
  limit: number;
}
export function searchBacklinkNotes(db: Sqlite3.DB, input: SearchBacklinkInput) {
  const nodeId = notePathToId(input.path);
  const files = dbApi
    .searchFiles(db, {
      query: `"(${nodeId})"`,
      limit: input.limit,
      paths: ["data/notes*"],
      ignore: getUserIgnores(db),
    })
    .filter((file) => file.path !== input.path);
  return files;
}

export function searchRecentNotes(db: Sqlite3.DB, limit: number) {
  const files = dbApi.getRecentFiles(db, { limit, paths: ["data/notes*"], ignore: getUserIgnores(db) });
  return files;
}

function consecutiveWordPrefixQuery(query: string) {
  return query
    .replace(/[\'"]/g, "")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => `"${word}"*`) // turn it into a prefix query
    .join(" ");
}
