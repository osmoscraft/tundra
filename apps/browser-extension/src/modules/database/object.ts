import type { DbObject } from "./schema";
import { bindParams } from "./utils";

export function setObject(db: Sqlite3.DB, path: string, data: any) {
  const sql = `
INSERT INTO Object (path, data) VALUES (:path, json(:data))
ON CONFLICT(path) DO UPDATE SET data = json(excluded.data)
`;
  const bind = bindParams(sql, { path, data: JSON.stringify(data) });

  db.exec(sql, { bind });
}

export function getObject<T = any>(db: Sqlite3.DB, path: string): T | undefined {
  const sql = `SELECT * FROM Object WHERE path = :path`;
  const bind = bindParams(sql, { path });

  const data = db.selectObject<DbObject>(sql, bind)?.data;
  return data ? JSON.parse(data) : undefined;
}

export function deleteObject(db: Sqlite3.DB, path: string) {
  const sql = `DELETE FROM Object WHERE path = :path`;
  const bind = bindParams(sql, { path });

  return db.exec(sql, { bind });
}
