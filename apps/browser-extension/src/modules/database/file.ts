import type { DbFile, DbFileInternal } from "./schema";
import { arrayToParams, paramsToBindings } from "./utils";

export interface FileChange {
  path: string;
  content: string | null;
  meta?: any;
  updatedTime?: string;
}

export function setLocalFile(db: Sqlite3.DB, file: FileChange) {
  const sql = `
  INSERT INTO File (path, localContent, meta, localUpdatedTime) VALUES (:path, :content, json(:meta), :updatedTime)
  ON CONFLICT(path) DO UPDATE SET localContent = excluded.content, meta = json(excluded.meta), localUpdatedTime = excluded.updatedTime
  `;

  const bindings = paramsToBindings(sql, {
    path: file.path,
    content: file.content,
    meta: JSON.stringify(file.meta),
    updatedTime: file.updatedTime ?? new Date().toISOString(),
  });

  return db.exec(sql, { bind: bindings });
}

export function setRemoteFile(db: Sqlite3.DB, file: FileChange) {
  const sql = `
  INSERT INTO File (path, remoteContent, remoteUpdatedTime) VALUES (:path, :content, :updatedTime)
  ON CONFLICT(path) DO UPDATE SET remoteContent = excluded.content, remoteUpdatedTime = excluded.updatedTime
  `;

  const bindings = paramsToBindings(sql, {
    path: file.path,
    content: file.content,
    updatedTime: file.updatedTime ?? new Date().toISOString(),
  });

  return db.exec(sql, { bind: bindings });
}

export function setLocalFiles(db: Sqlite3.DB, files: FileChange[]) {
  if (!files.length) return;

  const sql = `
INSERT INTO File (path, localContent, meta, localUpdatedTime) VALUES
${files.map((_, i) => /*reduce query size with shortname*/ `(:p${i}, :c${i}, json(:m${i}), :t${i})`).join(",")}
ON CONFLICT(path) DO UPDATE SET localContent = excluded.localContent, meta = json(excluded.meta), localUpdatedTime = excluded.localUpdatedTime
  `;

  const timedFiles = files.map((file) => {
    const timestamp = file.updatedTime ?? new Date().toISOString();

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
INSERT INTO File (path, remoteContent, meta, remoteUpdatedTime) VALUES
${files.map((_, i) => /*reduce query size with shortname*/ `(:p${i}, :c${i}, json(:m${i}), :t${i})`).join(",")}
ON CONFLICT(path) DO UPDATE SET remoteContent = excluded.remoteContent, meta = json(excluded.meta), remoteUpdatedTime = excluded.remoteUpdatedTime
  `;

  const timedFiles = files.map((file) => {
    const timestamp = file.updatedTime ?? new Date().toISOString();

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
  return db.exec(`DELETE FROM File`);
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
  const sql = `SELECT * FROM File ORDER BY updatedTime DESC LIMIT :limit`;
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
