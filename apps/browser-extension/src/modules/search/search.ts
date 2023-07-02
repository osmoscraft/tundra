import * as dbApi from "../database";
import { getUserIgnores } from "../sync";

export interface SearchInput {
  query: string;
  limit: number;
}

export function search(db: Sqlite3.DB, input: SearchInput) {
  const query = consecutiveWordPrefixQuery(input.query);
  console.log(`[search] internal query ${query}`);
  const files = dbApi.searchFiles(db, { query, limit: input.limit });
  return files;
}

export function searchRecentFiles(db: Sqlite3.DB, limit: number) {
  const files = dbApi.getRecentFiles(db, limit, getUserIgnores(db));
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
