import { assertDeepEqual, assertThrows } from "../../live-test";
import { migrate } from "../migrate";
import { createEmptyDb } from "./fixture";

export async function testMigrate() {
  const migrations = [
    {
      version: 1,
      script: `
CREATE TABLE foo (name TEXT);
INSERT INTO foo (name) VALUES ('item1');
`,
    },
  ];
  const db = await createEmptyDb();

  // before migration
  assertThrows(() => db.exec("SELECT * FROM foo"));

  // migrate to v1
  migrate(migrations, db);
  const fooRows = db.selectObjects<{ name: string }>("SELECT * FROM foo");
  assertDeepEqual(fooRows, [{ name: "item1" }]);

  // re-migrate has no effect
  migrate(migrations, db); // no error

  // migrate to v2
  migrations.push({
    version: 2,
    script: `
ALTER TABLE foo ADD COLUMN age INTEGER;
UPDATE foo SET age = 10;

CREATE TABLE bar (name TEXT);
INSERT INTO bar (name) VALUES ('item2');
`,
  });

  migrate(migrations, db);
  const fooRowsV2 = db.selectObjects<{ name: string; age: number }>("SELECT * FROM foo");
  assertDeepEqual(fooRowsV2, [{ name: "item1", age: 10 }]); // migrated

  const barRowsV2 = db.selectObjects<{ name: string }>("SELECT * FROM bar");
  assertDeepEqual(barRowsV2, [{ name: "item2" }]);
}
