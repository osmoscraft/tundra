import { deleteMany, paramsToBindings, selectMany, upsertMany } from "@tinykb/sqlite-utils";
import type { DbReadableFileV2, DbWritableFileV2 } from "./schema";

export function upsertFiles(db: Sqlite3.DB, files: DbWritableFileV2[]) {
  return upsertMany<DbWritableFileV2>(db, { table: "File", key: "path", rows: files });
}

export function upsertFile(db: Sqlite3.DB, file: DbWritableFileV2) {
  return upsertFiles(db, [file]);
}

export function selectFiles(db: Sqlite3.DB, paths: string[]) {
  return selectMany<DbReadableFileV2>(db, { table: "File", key: "path", value: paths });
}

export function selectFile(db: Sqlite3.DB, path: string) {
  return selectFiles(db, [path])[0];
}

export function deleteFiles(db: Sqlite3.DB, paths: string[]) {
  return deleteMany(db, { table: "File", key: "path", value: paths, comparator: "GLOB" });
}

export function deleteFile(db: Sqlite3.DB, path: string) {
  return deleteFiles(db, [path]);
}

export interface ListOptions {
  paths?: string[];
  limit?: number;
  orderBy?: OrderBy[];
  filters?: Filter[];
  ignore?: string[];
}

export type OrderBy = [col: keyof DbReadableFileV2, dir: "ASC" | "DESC"];

export type Filter = [
  col: keyof DbReadableFileV2,
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "IS" | "IS NOT",
  value: string | number
];

export function listFiles(db: Sqlite3.DB, options: ListOptions): DbReadableFileV2[] {
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
    `SELECT meta,path,content,isDeleted,status,updatedAt FROM File`,
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
  return db.selectObjects<DbReadableFileV2>(sql, bind);
}

export interface SearchOptions {
  query: string;
  paths?: string[];
  limit?: number;
  filters?: Filter[];
  ignore?: string[];
}

export function searchFiles(db: Sqlite3.DB, options: SearchOptions): DbReadableFileV2[] {
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
    `SELECT File.meta,File.path,File.content,isDeleted,status,updatedAt FROM File JOIN FileFts ON File.path = FileFts.path`,
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

  return db.selectObjects<DbReadableFileV2>(sql, bind);
}
