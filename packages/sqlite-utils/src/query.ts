import { arrayToParams, paramsToBindings } from "./params";

export interface DeleteManyInput<T extends {}> {
  table: string;
  key: string & keyof T;
  value: any[];
  comparator?: "=" | "GLOB" | "LIKE";
}
export function deleteMany<T extends {}>(db: Sqlite3.DB, input: DeleteManyInput<T>) {
  const sql = `
WITH DeleteList(valueList) AS (
  SELECT json_each.value FROM json_each(json(:valueList))
)
DELETE FROM ${input.table} WHERE EXISTS (
  SELECT 1
  FROM DeleteList
  WHERE ${input.table}.${input.key} ${input.comparator ?? "="} DeleteList.value
);
  `;

  const bind = paramsToBindings(sql, { valueList: JSON.stringify(input.value) });
  db.exec(sql, { bind });
}

export interface DeleteOneInput<T extends {}> {
  table: string;
  key: string & keyof T;
  value: any;
  comparator?: "=" | "GLOB" | "LIKE";
}
export function deleteOne<T extends {}>(db: Sqlite3.DB, input: DeleteOneInput<T>) {
  return deleteMany(db, { table: input.table, key: input.key, value: [input.value], comparator: input.comparator });
}

export interface SelectManyInput<T extends {}> {
  table: string;
  key: string & keyof T;
  value: any[];
  comparator?: "=" | "GLOB" | "LIKE";
}
export function selectMany<T extends {}>(db: Sqlite3.DB, input: SelectManyInput<T>): (T | undefined)[] {
  return input.value.map((value) => {
    return selectOne(db, { table: input.table, key: input.key, value, comparator: input.comparator });
  });
}

export interface SelectOneInput<T extends {}> {
  table: string;
  key: string & keyof T;
  value: any;
  comparator?: "=" | "GLOB" | "LIKE";
}

export function selectOne<T extends {}>(db: Sqlite3.DB, input: SelectOneInput<T>): T | undefined {
  const sql = `SELECT * FROM ${input.table} WHERE ${input.key} ${input.comparator ?? "="} :${input.key} LIMIT 1`;
  const bind = paramsToBindings(sql, { [input.key]: input.value });
  const file = db.selectObject<T>(sql, bind);
  return file;
}

export interface UpsertManyInput<T extends {}> {
  table: string;
  key: string & keyof T;
  rows: T[];
}

/**
 * Upsert multiple rows of different kind
 */
export function upsertMany<T extends {}>(db: Sqlite3.DB, input: UpsertManyInput<T>) {
  return input.rows.map((row) => {
    return upsertOne(db, { table: input.table, key: input.key, row });
  });
}

/**
 * Upsert multiple rows of the same kind
 */
export function upsertBulk<T extends {}>(db: Sqlite3.DB, input: UpsertManyInput<T>) {
  return upsertInternal(db, input);
}

export interface UpsertOneInput<T extends {}> {
  table: string;
  key: string & keyof T;
  row: T;
}

export function upsertOne<T extends {}>(db: Sqlite3.DB, input: UpsertOneInput<T>) {
  return upsertInternal(db, { table: input.table, key: input.key, rows: [input.row] });
}

function upsertInternal<T extends {}>(db: Sqlite3.DB, input: UpsertManyInput<T>) {
  if (!input.rows.length) return;

  const refRow = input.rows[0];
  const cols = Object.keys(refRow);
  const nonKeyCols = cols.filter((col) => col !== input.key);

  const sql = [
    `INSERT INTO ${input.table} (${cols.join(",")}) VALUES`,
    input.rows.map((_, i) => `(${cols.map((col) => `:${col}${i}`).join(",")})`).join(","),
    nonKeyCols.length
      ? `ON CONFLICT(${input.key}) DO UPDATE SET ${cols
          .filter((col) => col !== input.key)
          .map((col) => `${col} = excluded.${col}`)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  // TODO minimize col names to index
  const bind = paramsToBindings(sql, arrayToParams(input.rows));
  return db.exec(sql, { bind });
}
