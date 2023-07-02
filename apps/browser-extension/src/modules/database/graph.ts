import { paramsToBindings } from "@tinykb/sqlite-utils";
import { read, removeMany, writeMany } from "./file";
import type { DbFile, DbFileInternal } from "./schema";

export interface FileChange {
  path: string;
  content: string | null;
  meta?: any;
  updatedAt?: number;
}

export function setLocalFile(db: Sqlite3.DB, file: FileChange) {
  setLocalFiles(db, [file]);
}

export function setRemoteFile(db: Sqlite3.DB, file: FileChange) {
  setRemoteFiles(db, [file]);
}

export function setLocalFiles(db: Sqlite3.DB, files: FileChange[]) {
  writeMany(
    db,
    files.map((file) => ({
      path: file.path,
      localContent: file.content,
      localUpdatedAt: file.updatedAt ?? Date.now(),
      meta: JSON.stringify(file.meta),
    }))
  );
}

export function setRemoteFiles(db: Sqlite3.DB, files: FileChange[]) {
  writeMany(
    db,
    files.map((file) => ({
      path: file.path,
      remoteContent: file.content,
      remoteUpdatedAt: file.updatedAt ?? Date.now(),
      meta: JSON.stringify(file.meta),
    }))
  );
}

export function deleteFiles(db: Sqlite3.DB, patterns: string[]) {
  removeMany(db, patterns);
}

export function getFile(db: Sqlite3.DB, path: string): DbFile | undefined {
  const file = read(db, path);
  if (!file) return undefined;

  return {
    ...file,
    meta: file.meta !== null ? JSON.parse(file.meta) : {},
  };
}

export function getRecentFiles(db: Sqlite3.DB, limit: number): DbFile[] {
  const sql = `SELECT * FROM File ORDER BY updatedAt DESC LIMIT :limit`;
  const bind = paramsToBindings(sql, { limit });

  return db.selectObjects<DbFileInternal>(sql, bind).map(parseMeta);
}

export function getDirtyFiles(db: Sqlite3.DB, ignorePatterns: string[] = []): DbFile[] {
  const sql = `
  WITH Ignore(pattern) AS (
    SELECT json_each.value FROM json_each(json(:ignoreList))
  )
  SELECT *
  FROM File
  WHERE isDirty = 1 AND NOT EXISTS (
    SELECT 1
    FROM Ignore
    WHERE File.path GLOB Ignore.pattern
  );
  `;

  const bind = paramsToBindings(sql, { ignoreList: JSON.stringify(ignorePatterns) });
  return db.selectObjects<DbFileInternal>(sql, bind).map(parseMeta);
}

export interface SearchFilesInput {
  query: string;
  limit: number;
}
export function searchFiles(db: Sqlite3.DB, input: SearchFilesInput): DbFile[] {
  // weights map to fts columns: path, content, meta,
  const sql = `
SELECT * FROM File JOIN FileFts ON File.path = FileFts.path WHERE FileFts MATCH :query ORDER BY bm25(FileFts, 0.1, 1, 100) LIMIT :limit
`;

  const bind = paramsToBindings(sql, {
    query: input.query,
    limit: input.limit,
  });

  return db.selectObjects<DbFileInternal>(sql, bind).map(parseMeta);
}

function parseMeta(dbFile: DbFileInternal) {
  return {
    ...dbFile,
    meta: dbFile.meta !== null ? JSON.parse(dbFile.meta) : {},
  };
}
