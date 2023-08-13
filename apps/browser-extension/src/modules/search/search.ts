import * as dbApi from "../database";
import { getIgnorePatterns } from "../sync";
import { noteIdToPath, notePathToId } from "../sync/path";

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
    ignore: getIgnorePatterns(db),
  });
  return files.map(({ path, ...file }) => ({ ...file, id: notePathToId(path) }));
}

export interface SearchBacklinkInput {
  id: string;
  limit: number;
}
export function searchBacklinkNotes(db: Sqlite3.DB, input: SearchBacklinkInput) {
  const notePath = noteIdToPath(input.id);
  const files = dbApi
    .searchFiles(db, {
      query: `"(${input.id})"`,
      limit: input.limit,
      paths: ["data/notes*"],
      ignore: getIgnorePatterns(db),
    })
    .filter((file) => file.path !== notePath)
    .map(({ path, ...file }) => ({ ...file, id: notePathToId(path) }));

  return files;
}

export function searchRecentFiles(db: Sqlite3.DB, limit: number) {
  return dbApi.getRecentFiles(db, { limit });
}

export function searchRecentNotes(db: Sqlite3.DB, limit: number) {
  const files = dbApi.getRecentFiles(db, { limit, paths: ["data/notes*"], ignore: getIgnorePatterns(db) });
  const filesWithIds = files.map(({ path, ...file }) => ({ ...file, id: notePathToId(path) }));
  return filesWithIds;
}

function consecutiveWordPrefixQuery(query: string) {
  return query
    .replace(/[\'"]/g, "")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => `"${word}"*`) // turn it into a prefix query
    .join(" ");
}
