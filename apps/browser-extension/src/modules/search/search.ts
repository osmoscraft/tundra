import * as dbApi from "../database";
import { getUserIgnores } from "../sync";
import { consecutiveWordPrefixQuery } from "./get-query";

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
