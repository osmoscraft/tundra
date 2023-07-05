import { sqlite3Mem } from "@tinykb/sqlite-utils";

let db: Sqlite3.DB | undefined;
export async function createTestDb(schema: string) {
  db ??= await createEmptyDb();
  db.exec(`
  DROP TABLE IF EXISTS File;
  DROP INDEX IF EXISTS IsDirtyIdx;
  DROP INDEX IF EXISTS UpdatedAtIdx;
  DROP TABLE IF EXISTS FileFts;
  DROP TRIGGER IF EXISTS FileFtsAfterInsertTrigger;
  DROP TRIGGER IF EXISTS FileFtsAfterDeleteTrigger;
  DROP TRIGGER IF EXISTS FileFtsAfterUpdateTrigger;

  -- v2
  DROP TABLE IF EXISTS FileV2;
  DROP TRIGGER IF EXISTS FileV2AfterInsertTrigger;
  DROP TRIGGER IF EXISTS FileV2AfterUpdateTrigger;
  `);
  db.exec(schema);

  return db;
}

export async function createEmptyDb() {
  const db = await sqlite3Mem("./sqlite3/jswasm/");
  return db;
}
