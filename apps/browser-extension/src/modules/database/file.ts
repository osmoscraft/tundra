import { arrayToParams, paramsToBindings } from "@tinykb/sqlite-utils";
import type { DbFileInternal, DbFileReadable, DbFileWritable } from "./schema";

export type FileWrite = Pick<DbFileWritable, "path" | "meta"> & Partial<DbFileWritable>;
export function writeMany(db: Sqlite3.DB, files: FileWrite[]) {
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

export function removeMany(db: Sqlite3.DB, paths: string[]) {
  if (!paths.length) return;

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

  const bind = paramsToBindings(sql, { patterns: JSON.stringify(paths) });
  db.exec(sql, { bind });
}

export interface ListOptions {
  paths?: string[];
  limit?: number;
  orderBy?: OrderBy[];
  filters?: Filter[];
  ignore?: string[];
}

export type OrderBy = [col: keyof DbFileInternal, dir: "ASC" | "DESC"];

export type Filter = [
  col: keyof DbFileInternal,
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "IS" | "IS NOT",
  value: string | number
];

// TODO refactor into DB Utils
export function list(db: Sqlite3.DB, options: ListOptions): DbFileReadable[] {
  const clauses = [
    ...(options.paths?.length || options.ignore?.length
      ? [
          "WITH",
          [
            ...(options.paths?.length
              ? [`Include(pattern) AS (SELECT json_each.value FROM json_each(json(:include)))`]
              : []),
            ...(options.ignore?.length
              ? [`Ignore(pattern) AS (SELECT json_each.value FROM json_each(json(:ignore)))`]
              : []),
          ].join("\n,"),
        ]
      : []),
    `SELECT meta,path,content,isDeleted,isDirty,updatedAt FROM File`,
    ...(options.filters?.length || options.paths?.length || options.ignore?.length
      ? [
          "WHERE",
          [
            ...(options.filters?.map(([col, op]) => `${col} ${op} :${col}`) ?? []),
            ...(options.paths?.length ? [`EXISTS ( SELECT 1 FROM Include WHERE File.path GLOB Include.pattern)`] : []),
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
    ...(options.paths ? { include: JSON.stringify(options.paths) } : {}),
    ...(options.ignore ? { ignore: JSON.stringify(options.ignore) } : {}),
  };

  const sql = clauses.join("\n");
  const bind = paramsToBindings(sql, dict);
  return db.selectObjects<DbFileInternal>(sql, bind);
}

export interface SearchOptions {
  query: string;
  paths?: string[];
  limit?: number;
  filters?: Filter[];
  ignore?: string[];
}

export function search(db: Sqlite3.DB, options: SearchOptions): DbFileReadable[] {
  const clauses = [
    ...(options.paths?.length || options.ignore?.length
      ? [
          "WITH",
          [
            ...(options.paths?.length
              ? [`Include(pattern) AS (SELECT json_each.value FROM json_each(json(:include)))`]
              : []),
            ...(options.ignore?.length
              ? [`Ignore(pattern) AS (SELECT json_each.value FROM json_each(json(:ignore)))`]
              : []),
          ].join("\n,"),
        ]
      : []),
    `SELECT File.meta,File.path,File.content,isDeleted,isDirty,updatedAt FROM File JOIN FileFts ON File.path = FileFts.path`,
    ...[
      "WHERE",
      [
        `FileFts MATCH :query`,
        ...(options.filters?.map(([col, op]) => `File.${col} ${op} :${col}`) ?? []),
        ...(options.paths?.length ? [`EXISTS ( SELECT 1 FROM Include WHERE File.path GLOB Include.pattern)`] : []),
        ...(options.ignore?.length ? [`NOT EXISTS ( SELECT 1 FROM Ignore WHERE File.path GLOB Ignore.pattern)`] : []),
      ].join(" AND "),
    ],
    `ORDER BY bm25(FileFts, 0.1, 1, 100)`, // weights map to fts columns: path, content, meta,
    ...(options.limit !== undefined ? [`LIMIT :limit`] : []),
  ];

  const dict = {
    query: options.query,
    ...options.filters?.reduce((acc, [col, _op, value]) => ({ ...acc, [col]: value }), {}),
    ...(options.limit !== undefined ? { limit: options.limit } : {}),
    ...(options.paths ? { include: JSON.stringify(options.paths) } : {}),
    ...(options.ignore ? { ignore: JSON.stringify(options.ignore) } : {}),
  };

  const sql = clauses.join(" ");

  const bind = paramsToBindings(sql, dict);

  return db.selectObjects<DbFileInternal>(sql, bind);
}
