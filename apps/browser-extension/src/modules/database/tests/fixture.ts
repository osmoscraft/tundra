import { sqlite3Mem } from "@tinykb/sqlite-utils";

export async function createTestDb(schema: string) {
  const db = await sqlite3Mem("./sqlite3/jswasm/");
  db.exec(schema);
  return db;
}
