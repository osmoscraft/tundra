import type { DbFile } from "./schema";
import { arrayToParams, bindParams } from "./utils";

export interface UpsertFileInput {
  path: string;
  updatedTime: number;
  content?: string;
  localHash?: string;
  remoteHash?: string;
}

export function setFile(db: Sqlite3.DB, file: UpsertFileInput) {
  const sql = `
INSERT INTO File (path, content, updatedTime, localHash, remoteHash) VALUES (:path, :content, :updatedTime, :localHash, :remoteHash)
ON CONFLICT(path) DO UPDATE SET content = excluded.content, updatedTime = excluded.updatedTime, localHash = excluded.localHash, remoteHash = excluded.remoteHash
  `;
  const bind = bindParams(sql, file);

  return db.exec(sql, { bind });
}

export function setFiles(db: Sqlite3.DB, files: UpsertFileInput[]) {
  const sql = `
INSERT INTO File (path, content, updatedTime, localHash, remoteHash) VALUES
${files.map((_, i) => `(:path${i}, :content${i}, :updatedTime${i}, :localHash${i}, :remoteHash${i})`).join(",")}
ON CONFLICT(path) DO UPDATE SET content = excluded.content, updatedTime = excluded.updatedTime, localHash = excluded.localHash, remoteHash = excluded.remoteHash
  `;

  const bind = bindParams(sql, arrayToParams(files));

  return db.exec(sql, { bind });
}

export function getFile(db: Sqlite3.DB, path: string): DbFile | undefined {
  const sql = `SELECT * FROM File WHERE path = :path`;
  const bind = bindParams(sql, { path });

  return db.selectObject<DbFile>(sql, bind) ?? undefined;
}

export function deleteFile(db: Sqlite3.DB, path: string) {
  const sql = `DELETE FROM File WHERE path = :path`;
  const bind = bindParams(sql, { path });

  return db.exec(sql, { bind });
}
