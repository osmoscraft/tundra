import { arrayToParams, paramsToBindings } from "@tinykb/sqlite-utils";
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
  if (!files.length) return;

  const sql = `
INSERT INTO File (path, localContent, meta, localUpdatedAt) VALUES
${files.map((_, i) => /*reduce query size with shortname*/ `(:p${i}, :c${i}, json(:m${i}), :t${i})`).join(",")}
ON CONFLICT(path) DO UPDATE SET localContent = excluded.localContent, meta = json(excluded.meta), localUpdatedAt = excluded.localUpdatedAt
  `;

  const timedFiles = files.map((file) => {
    const timestamp = file.updatedAt ?? Date.now();

    return {
      p: file.path,
      c: file.content,
      m: JSON.stringify(file.meta),
      t: timestamp,
    };
  });

  const bind = paramsToBindings(sql, arrayToParams(timedFiles));

  return db.exec(sql, { bind });
}

export function setRemoteFiles(db: Sqlite3.DB, files: FileChange[]) {
  if (!files.length) return;

  const sql = `
INSERT INTO File (path, remoteContent, meta, remoteUpdatedAt) VALUES
${files.map((_, i) => /*reduce query size with shortname*/ `(:p${i}, :c${i}, json(:m${i}), :t${i})`).join(",")}
ON CONFLICT(path) DO UPDATE SET remoteContent = excluded.remoteContent, meta = json(excluded.meta), remoteUpdatedAt = excluded.remoteUpdatedAt
  `;

  const timedFiles = files.map((file) => {
    const timestamp = file.updatedAt ?? Date.now();

    return {
      p: file.path,
      c: file.content,
      m: JSON.stringify(file.meta),
      t: timestamp,
    };
  });

  const bind = paramsToBindings(sql, arrayToParams(timedFiles));

  return db.exec(sql, { bind });
}

export function deleteAllFiles(db: Sqlite3.DB) {
  return deleteFiles(db, ["*"]);
}

export function deleteFiles(db: Sqlite3.DB, patterns: string[]) {
  if (!patterns.length) return;

  const sql = `
  WITH DeleteList(pattern) AS (
    SELECT json_each.value FROM json_each(json(:patterns))
  )
  DELETE FROM File WHERE EXISTS (
    SELECT 1
    FROM DeleteList
    WHERE File.path GLOB DeleteList.pattern
  );
  `;

  const bind = paramsToBindings(sql, { patterns: JSON.stringify(patterns) });
  db.exec(sql, { bind });
}

export function getFile(db: Sqlite3.DB, path: string): DbFile | undefined {
  const sql = `SELECT * FROM File WHERE path = :path`;
  const bind = paramsToBindings(sql, { path });

  const raw = db.selectObject<DbFileInternal>(sql, bind);
  if (!raw) return undefined;

  return {
    ...raw,
    meta: raw.meta !== null ? JSON.parse(raw.meta) : {},
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
