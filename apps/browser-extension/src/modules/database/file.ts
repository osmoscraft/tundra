import { arrayToParams, paramsToBindings } from "@tinykb/sqlite-utils";
import type { DbFile, DbFileInternal, DbFileWritable } from "./schema";

export type DbFileRemoteWritable = Omit<DbFileWritable, "localContent" | "localUpdatedAt">;
export type DbFileLocalWritable = Omit<DbFileWritable, "remoteContent" | "remoteUpdatedAt">;
export function write(db: Sqlite3.DB, files: DbFileWritable[] | DbFileLocalWritable[] | DbFileRemoteWritable[]) {
  if (!files.length) return;

  const cols = Object.keys(files[0]);

  const sql = `
INSERT INTO File (${cols.join(",")}) VALUES
${files.map((_, i) => `(${cols.map((col) => `:${col}${i}`).join(",")})`).join(",")}
ON CONFLICT(path) DO UPDATE SET ${cols.filter((col) => col !== "path").map((col) => `${col} = excluded.${col}`)}
  `;

  const bind = paramsToBindings(sql, arrayToParams(files));

  return db.exec(sql, { bind });
}

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
  write(
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
  write(
    db,
    files.map((file) => ({
      path: file.path,
      remoteContent: file.content,
      remoteUpdatedAt: file.updatedAt ?? Date.now(),
      meta: JSON.stringify(file.meta),
    }))
  );
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
