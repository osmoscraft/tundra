import { sqlite3Mem } from "@tinykb/sqlite-utils";

let db: Sqlite3.DB | undefined;
export async function createTestDb(schema: string) {
  db ??= await createTestDbInternal(schema);
  db.exec(`DELETE FROM File;`);

  return db;
}

export async function createTestDbInternal(schema: string) {
  const db = await sqlite3Mem("./sqlite3/jswasm/");
  db.exec(schema);
  return db;
}
