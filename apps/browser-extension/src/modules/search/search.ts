import * as dbApi from "../database";
import { getUserIgnores } from "../sync";

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
    globs: ["data/notes*"],
    ignore: getUserIgnores(db),
  });
  return files;
}

export function searchRecentNotes(db: Sqlite3.DB, limit: number) {
  const files = dbApi.getRecentFiles(db, { limit, globs: ["data/notes*"], ignore: getUserIgnores(db) });
  return files;
}

function consecutiveWordPrefixQuery(query: string) {
  return query
    .replace(/[\'"]/g, "")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => `"${word}"*`)
    .join(" ");
}
