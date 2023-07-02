import { arrayToParams, paramsToBindings } from "@tinykb/sqlite-utils";
import type { DbFileInternal, DbFileReadable, DbFileWritable } from "./schema";

export function writeMany(db: Sqlite3.DB, files: (Pick<DbFileWritable, "path" | "meta"> & Partial<DbFileWritable>)[]) {
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

  const file = db.selectObject<DbFileInternal>(sql, bind);
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

export function list(db: Sqlite3.DB, options: ListOptions): DbFileReadable[] {
  const clauses = [
    ...(options.globs?.length || options.ignore?.length ? ["WITH"] : []),
    ...(options.globs?.length ? [`Include(pattern) AS (SELECT json_each.value FROM json_each(json(:include)))`] : []),
    ...(options.ignore?.length ? [`Ignore(pattern) AS (SELECT json_each.value FROM json_each(json(:ignore)))`] : []),
    `SELECT meta,path,content,isDeleted,isDirty,updatedAt FROM File`,
    ...(options.filters?.length
      ? [
          "WHERE",
          [
            ...options.filters.map(([col, op]) => `${col} ${op} :${col}`),
            ...(options.globs?.length ? [`EXISTS ( SELECT 1 FROM Include WHERE File.path GLOB Include.pattern)`] : []),
            ...(options.ignore?.length
              ? [`NOT EXISTS ( SELECT 1 FROM Ignore WHERE File.path GLOB Ignore.pattern)`]
              : []),
          ].join(" AND "),
        ]
      : []),
    ...(options.orderBy?.length ? [`ORDER BY ${options.orderBy.map(([col, dir]) => `${col} ${dir}`).join(",")}`] : []),
    ...(options.limit !== undefined ? [`LIMIT :limit`] : []),
  ];

  const dict = {
    ...options.filters?.reduce((acc, [col, _op, value]) => ({ ...acc, [col]: value }), {}),
    ...(options.limit !== undefined ? { limit: options.limit } : {}),
    ...(options.globs ? { include: JSON.stringify(options.globs) } : {}),
    ...(options.ignore ? { ignore: JSON.stringify(options.ignore) } : {}),
  };

  const sql = clauses.join("\n");
  const bind = paramsToBindings(sql, dict);
  return db.selectObjects<DbFileInternal>(sql, bind);
}

export interface PathOptions {
  exclude?: string[];
  include?: string[];
}

export interface ListOptions {
  globs?: string[];
  limit?: number;
  orderBy?: OrderBy[];
  filters?: Filter[];
  ignore?: string[];
}

export interface SearchOptions extends ListOptions {
  query: string;
}

export type OrderBy = [col: keyof DbFileInternal, dir: "ASC" | "DESC"];

export type Filter = [
  col: keyof DbFileInternal,
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "IS" | "IS NOT",
  value: string | number
];

export interface FileWrite {
  path: string;
  meta: string | null;
  localContent?: string | null;
  localUpdatedAt?: number;
  remoteContent?: string | null;
  remoteUpdatedAt?: number;
}
