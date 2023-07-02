import { arrayToParams, paramsToBindings } from "@tinykb/sqlite-utils";
import type { DbFileInternalV2, DbFileReadable, DbFileWritable } from "./schema";

export type DbFileRemoteWritable = Omit<DbFileWritable, "localContent" | "localUpdatedAt">;
export type DbFileLocalWritable = Omit<DbFileWritable, "remoteContent" | "remoteUpdatedAt">;
export function writeMany(db: Sqlite3.DB, files: DbFileWritable[] | DbFileLocalWritable[] | DbFileRemoteWritable[]) {
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

export function read(db: Sqlite3.DB, path: string): DbFileReadable | undefined {
  const sql = `SELECT meta,path,content,isDeleted,isDirty,updatedAt FROM File WHERE path = :path`;
  const bind = paramsToBindings(sql, { path });

  const file = db.selectObject<DbFileInternalV2>(sql, bind);
  return file;
}

export function removeMany(db: Sqlite3.DB, globs: string[]) {
  if (!globs.length) return;

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

  const bind = paramsToBindings(sql, { patterns: JSON.stringify(globs) });
  db.exec(sql, { bind });
}
export function search(db: Sqlite3.DB, options: SearchOptions) {}

export interface PathOptions {
  exclude?: string[];
  include?: string[];
}

export interface ListOptions {
  paths?: string[];
  limit?: number;
  orderBy?: OrderByOption[];
  direction?: DirectionOption;
  filters?: FilterOption[];
  exclude?: string[];
  include?: string[];
}

export interface SearchOptions extends ListOptions {
  query: string;
}

export enum OrderByOption {
  Path = "path",
  UpdatedAt = "updatedAt",
}

export enum DirectionOption {
  Asc = "ASC",
  Desc = "DESC",
}

export enum FilterOption {
  IsDirty = "isDirty",
  IsDeleted = "isDeleted",
}

export interface FileWrite {
  path: string;
  meta: string | null;
  localContent?: string | null;
  localUpdatedAt?: number;
  remoteContent?: string | null;
  remoteUpdatedAt?: number;
}
