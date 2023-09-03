import { deleteMany, paramsToBindings, selectMany, upsertMany } from "@tundra/sqlite-utils";
import type { DbReadableFile, DbWritableFile } from "./schema";

export function updateFiles(db: Sqlite3.DB, files: DbWritableFile[]) {
  return upsertMany<DbWritableFile>(db, { table: "File", key: "path", rows: files });
}

export function updateFile(db: Sqlite3.DB, file: DbWritableFile) {
  return updateFiles(db, [file]);
}

export function getFiles(db: Sqlite3.DB, paths: string[]) {
  return selectMany<DbReadableFile>(db, { table: "File", key: "path", value: paths });
}

export function getFile(db: Sqlite3.DB, path: string) {
  return getFiles(db, [path])[0];
}

export function removeFiles(db: Sqlite3.DB, paths: string[]) {
  return deleteMany(db, { table: "File", key: "path", value: paths, comparator: "GLOB" });
}

export function removeFile(db: Sqlite3.DB, path: string) {
  return removeFiles(db, [path]);
}

export interface CopyFileSourceInput {
  source: "local" | "remote";
  paths: string[];
  filters?: Filter[];
  ignore?: string[];
}
export function syncFile(db: Sqlite3.DB, source: string, target: string) {}

export interface ListOptions {
  paths?: string[];
  limit?: number;
  orderBy?: OrderBy[];
  filters?: Filter[];
  ignore?: string[];
}

export type OrderBy = [col: keyof DbReadableFile, dir: "ASC" | "DESC"];

export type Filter = [
  col: keyof DbReadableFile,
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "IS" | "IS NOT",
  value: string | number
];

function orderAndLimit(options: ListOptions) {
  return [
    ...(options.orderBy?.length ? [`ORDER BY ${options.orderBy.map(([col, dir]) => `${col} ${dir}`).join(",")}`] : []),
    ...(options.limit !== undefined ? [`LIMIT :limit`] : []),
  ];
}

export function listFiles(db: Sqlite3.DB, options: ListOptions): DbReadableFile[] {
  const clauses = [
    ...withIncludeAndIgnore(options),
    `SELECT * FROM File`,
    ...whereFilterPathIgnore(options),
    ...orderAndLimit(options),
  ];

  const dict = {
    ...options.filters?.reduce((acc, [col, _op, value]) => ({ ...acc, [col]: value }), {}),
    ...(options.limit !== undefined ? { limit: options.limit } : {}),
    ...(options.paths ? { include: JSON.stringify(options.paths) } : {}),
    ...(options.ignore ? { ignore: JSON.stringify(options.ignore) } : {}),
  };

  const sql = clauses.join("\n");

  const bind = paramsToBindings(sql, dict);
  return db.selectObjects<DbReadableFile>(sql, bind);
}

export function getFileCount(db: Sqlite3.DB, options: ListOptions): number {
  const clauses = [...withIncludeAndIgnore(options), `SELECT COUNT(*) FROM File`, ...whereFilterPathIgnore(options)];

  const dict = {
    ...options.filters?.reduce((acc, [col, _op, value]) => ({ ...acc, [col]: value }), {}),
    ...(options.paths ? { include: JSON.stringify(options.paths) } : {}),
    ...(options.ignore ? { ignore: JSON.stringify(options.ignore) } : {}),
  };

  const sql = clauses.join("\n");

  const bind = paramsToBindings(sql, dict);
  return db.selectValue<number>(sql, bind) ?? 0;
}

function withIncludeAndIgnore(options: ListOptions) {
  return options.paths?.length || options.ignore?.length
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
    : [];
}

function whereFilterPathIgnore(options: ListOptions) {
  const hasWhereClause = options.filters?.length || options.paths?.length || options.ignore?.length;

  return hasWhereClause
    ? [
        "WHERE",
        [
          ...(options.filters?.map(([col, op]) => `${col} ${op} :${col}`) ?? []),
          ...(options.paths?.length ? [`EXISTS ( SELECT 1 FROM Include WHERE File.path GLOB Include.pattern)`] : []),
          ...(options.ignore?.length ? [`NOT EXISTS ( SELECT 1 FROM Ignore WHERE File.path GLOB Ignore.pattern)`] : []),
        ].join(" AND "),
      ]
    : [];
}

export interface SearchOptions {
  query: string;
  paths?: string[];
  limit?: number;
  filters?: Filter[];
  ignore?: string[];
}

export function searchFiles(db: Sqlite3.DB, options: SearchOptions): DbReadableFile[] {
  const clauses = [
    ...withIncludeAndIgnore(options),
    `SELECT File.meta,File.path,File.content,localAction,remoteAction,status,updatedAt FROM File JOIN FileFts ON File.path = FileFts.path`,
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

  return db.selectObjects<DbReadableFile>(sql, bind);
}
