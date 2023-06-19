import * as dbApi from "../database";
import type { DbFile, DbNode } from "../database/schema";

export interface SearchInput {
  query: string;
  limit: number;
}

export interface SearchResult {
  file: DbFile;
  node: DbNode;
}

export function search(db: Sqlite3.DB, input: SearchInput): SearchResult[] {
  const files = dbApi.searchFiles(db, { query: input.query, limit: input.limit });

  const results = files
    .map((file) => ({
      file,
      node: dbApi.getNode(db, file.path),
    }))
    .filter(hasNode);

  return results;
}

function hasNode(
  maybeResult: Omit<SearchResult, "node"> & Pick<Partial<SearchResult>, "node">
): maybeResult is SearchResult {
  return !!maybeResult.node;
}
