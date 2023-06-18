import type { DbFile } from "./schema";
import { arrayToParams, paramsToBindings } from "./utils";

export interface FileChange {
  path: string;
  content: string | null;
  updatedTime?: string;
}

export function setLocalFile(db: Sqlite3.DB, file: FileChange) {
  const sql = `
  INSERT INTO File (path, localContent, localUpdatedTime) VALUES (:path, :content, :updatedTime)
  ON CONFLICT(path) DO UPDATE SET localContent = excluded.content, localUpdatedTime = excluded.updatedTime
  `;

  const bindings = paramsToBindings(sql, {
    path: file.path,
    content: file.content,
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
INSERT INTO File (path, localContent, localUpdatedTime) VALUES
${files.map((_, i) => /*reduce query size with shortname*/ `(:p${i}, :c${i}, :t${i})`).join(",")}
ON CONFLICT(path) DO UPDATE SET localContent = excluded.localContent, localUpdatedTime = excluded.localUpdatedTime
  `;

  const timedFiles = files.map((file) => {
    const timestamp = file.updatedTime ?? new Date().toISOString();

    return {
      p: file.path,
      c: file.content,
      t: timestamp,
    };
  });

  const bind = paramsToBindings(sql, arrayToParams(timedFiles));

  return db.exec(sql, { bind });
}

export function setRemoteFiles(db: Sqlite3.DB, files: FileChange[]) {
  if (!files.length) return;

  const sql = `
INSERT INTO File (path, remoteContent, remoteUpdatedTime) VALUES
${files.map((_, i) => /*reduce query size with shortname*/ `(:p${i}, :c${i}, :t${i})`).join(",")}
ON CONFLICT(path) DO UPDATE SET remoteContent = excluded.remoteContent, remoteUpdatedTime = excluded.remoteUpdatedTime
  `;

  const timedFiles = files.map((file) => {
    const timestamp = file.updatedTime ?? new Date().toISOString();

    return {
      p: file.path,
      c: file.content,
      t: timestamp,
    };
  });

  const bind = paramsToBindings(sql, arrayToParams(timedFiles));

  return db.exec(sql, { bind });
}

export function getFile(db: Sqlite3.DB, path: string): DbFile | undefined {
  const sql = `SELECT * FROM File WHERE path = :path`;
  const bind = paramsToBindings(sql, { path });

  return db.selectObject<DbFile>(sql, bind) ?? undefined;
}

export function getRecentFiles(db: Sqlite3.DB, limit: number): DbFile[] {
  const sql = `SELECT * FROM File ORDER BY updatedTime DESC LIMIT :limit`;
  const bind = paramsToBindings(sql, { limit });

  return db.selectObjects<DbFile>(sql, bind);
}

export function getDirtyFiles(db: Sqlite3.DB): DbFile[] {
  const sql = `SELECT * FROM File WHERE isDirty = 1`;
  return db.selectObjects<DbFile>(sql);
}

export function deleteAllFiles(db: Sqlite3.DB) {
  return db.exec(`DELETE FROM File`);
}

export interface SearchFilesInput {
  query: string;
  limit: number;
}
export function searchFiles(db: Sqlite3.DB, input: SearchFilesInput) {
  const sql = `
SELECT * FROM File WHERE path IN (
  SELECT path FROM FileFts WHERE content MATCH :query ORDER BY rank LIMIT :limit
)
`;

  const bind = paramsToBindings(sql, {
    query: input.query,
    limit: input.limit,
  });

  return db.selectObjects<DbFile>(sql, bind);
}
