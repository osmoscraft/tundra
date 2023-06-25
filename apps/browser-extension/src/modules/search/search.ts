import * as dbApi from "../database";
import type { DbFile } from "../database/schema";
import { consecutiveWordPrefixQuery } from "./get-query";

export interface SearchInput {
  query: string;
  limit: number;
}

export function search(db: Sqlite3.DB, input: SearchInput): DbFile[] {
  const query = consecutiveWordPrefixQuery(input.query);
  console.log(`[search] internal query ${query}`);
  const files = dbApi.searchFiles(db, { query, limit: input.limit });
  return files;
}

export function searchRecentFiles(db: Sqlite3.DB, limit: number): DbFile[] {
  const files = dbApi.getRecentFiles(db, limit);
  return files;
}
