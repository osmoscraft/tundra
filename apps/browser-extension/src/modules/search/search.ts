import * as dbApi from "../database";
import type { DbFile, DbNode } from "../database/schema";
import { consecutiveWordPrefixQuery } from "./get-query";

export interface SearchInput {
  query: string;
  limit: number;
}

export interface SearchResult {
  file: DbFile;
  node: DbNode;
}

export function search(db: Sqlite3.DB, input: SearchInput): SearchResult[] {
  const query = consecutiveWordPrefixQuery(input.query);
  console.log(`[search] internal query ${query}`);
  return db.transaction(() => {
    const files = dbApi.searchFiles(db, { query, limit: input.limit });

    const results = files
      .map((file) => ({
        file,
        node: dbApi.getNode(db, file.path),
      }))
      .filter(hasNode);

    return results;
  });
}

export function searchRecentFiles(db: Sqlite3.DB, limit: number): SearchResult[] {
  return db.transaction(() => {
    performance.mark("searchRecentFiles");
    const files = dbApi.getRecentFiles(db, limit);

    const results = files
      .map((file) => ({
        file,
        node: dbApi.getNode(db, file.path),
      }))
      .filter(hasNode);

    return results;
  });
}

function hasNode(
  maybeResult: Omit<SearchResult, "node"> & Pick<Partial<SearchResult>, "node">
): maybeResult is SearchResult {
  return !!maybeResult.node;
}
