import { sqlite3Mem } from "@tinykb/sqlite-utils";
import { assertEqual } from "../live-test";
import SCHEMA from "./schema.sql";

export async function checkHealth() {
  function log(message: string) {
    return console.log("[checkHealth/DB]", message);
  }

  async function runSpec(name: string, spec: () => Promise<void>) {
    await spec();
    log(`${name} success`);
  }

  async function runTests() {
    log("started");
    runSpec("schema", testSchema);
    runSpec("dirty flag", testDirtyFlag);
    log("success");
  }

  return runTests()
    .then(() => {
      return true;
    })
    .catch((e) => {
      console.error(e);
      return false;
    });
}

async function testSchema() {
  await createDbWithSchema();
}

async function testDirtyFlag() {
  const db = await createDbWithSchema();

  db.exec(`
  INSERT INTO File (path, updatedTime, localHash, remoteHash) VALUES
  ('/test-1.md', 0, NULL, NULL),
  ('/test-2.md', 0, NULL, 'test'),
  ('/test-3.md', 0, 'test', NULL),
  ('/test-4.md', 0, 'test', 'test'),
  ('/test-5.md', 0, 'test', 'test different')
  `);

  const [file1, file2, file3, file4, file5] = [1, 2, 3, 4, 5].map((i) =>
    db.selectObject<{ path: string; isDirty: boolean }>(`SELECT path, isDirty FROM File WHERE path = :path`, {
      ":path": `/test-${i}.md`,
    })
  );

  assertEqual(file1?.isDirty, 0, "same null hash");
  assertEqual(file2?.isDirty, 1, "local null");
  assertEqual(file3?.isDirty, 1, "remote null");
  assertEqual(file4?.isDirty, 0, "same hash");
  assertEqual(file5?.isDirty, 1, "different hash");
}

async function createDbWithSchema() {
  const db = await sqlite3Mem("./sqlite3/jswasm/");
  db.exec(SCHEMA);
  return db;
}
