import type { DbFile } from "./schema";
import { arrayToParams, paramsToBindings } from "./utils";

export interface SetFileInput {
  path: string;
  content: string | null;
  updatedTime?: string;
}

export function setLocalFile(db: Sqlite3.DB, file: SetFileInput) {
  const sql = `
INSERT INTO File (path, content, updatedTime) VALUES (:path, :content, :updatedTime)
ON CONFLICT(path) DO UPDATE SET content = excluded.content, updatedTime = excluded.updatedTime
`;

  const bindings = paramsToBindings(sql, {
    path: file.path,
    content: file.content,
    updatedTime: file.updatedTime ?? new Date().toISOString(),
  });

  return db.exec(sql, { bind: bindings });
}

export function setSyncedFile(db: Sqlite3.DB, file: SetFileInput) {
  const sql = `
INSERT INTO File (path, content, updatedTime, remoteUpdatedTime) VALUES (:path, :content, :updatedTime, :remoteUpdatedTime)
ON CONFLICT(path) DO UPDATE SET content = excluded.content, updatedTime = excluded.updatedTime, remoteUpdatedTime = excluded.remoteUpdatedTime
`;

  const timestamp = file.updatedTime ?? new Date().toISOString();

  const bindings = paramsToBindings(sql, {
    path: file.path,
    content: file.content,
    updatedTime: timestamp,
    remoteUpdatedTime: timestamp,
  });

  return db.exec(sql, { bind: bindings });
}

export function setSyncedFiles(db: Sqlite3.DB, files: SetFileInput[]) {
  const sql = `
INSERT INTO File (path, content, updatedTime, remoteUpdatedTime) VALUES
${files.map((_, i) => `(:path${i}, :content${i}, :updatedTime${i}, :remoteUpdatedTime${i})`).join(",")}
ON CONFLICT(path) DO UPDATE SET content = excluded.content, updatedTime = excluded.updatedTime, remoteUpdatedTime = excluded.remoteUpdatedTime
  `;

  const timedFiles = files.map((file) => {
    const timestamp = file.updatedTime ?? new Date().toISOString();

    return {
      path: file.path,
      content: file.content,
      updatedTime: timestamp,
      remoteUpdatedTime: timestamp,
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

export function listFiles(db: Sqlite3.DB, limit: number, offset?: number) {
  const appendClause: string[] = [];
  const appendDict: Record<string, string> = {};

  if (limit) {
    appendClause.push("LIMIT :limit");
    appendDict[":limit"] = limit.toString();
  }

  if (offset) {
    appendClause.push("OFFSET :offset");
    appendDict[":offset"] = offset.toString();
  }

  return db.selectObjects<DbFile>(`SELECT * FROM File ${appendClause.join(" ")}`, { ...appendDict });
}

export function getDirtyFiles(db: Sqlite3.DB): DbFile[] {
  const sql = `SELECT * FROM File WHERE isDirty = 1`;

  return db.selectObjects<DbFile>(sql);
}

export function deleteFile(db: Sqlite3.DB, path: string) {
  const sql = `DELETE FROM File WHERE path = :path`;
  const bind = paramsToBindings(sql, { path });

  return db.exec(sql, { bind });
}

export function deleteAllFiles(db: Sqlite3.DB) {
  const sql = `DELETE FROM File`;

  return db.exec(sql);
}
