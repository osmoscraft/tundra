import { sqlite3Mem } from "@tinykb/sqlite-utils";
import { assertDeepEqual, assertEqual } from "../live-test";
import { deleteFile, getFile, setFile, setFiles } from "./file";
import { deleteObject, getObject, setObject } from "./object";
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
    runSpec("Schema", testSchema);
    runSpec("File CRUD", testFileCRUD);
    runSpec("File dirty flag", testDirtyFlag);
    runSpec("Object CRUD", testObjectCRUD);
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

async function testFileCRUD() {
  const db = await createDbWithSchema();

  setFile(db, {
    path: "/test.md",
    updatedTime: 0,
  });

  const file = getFile(db, "/test.md");

  assertEqual(file?.path, "/test.md", "path after write and read");
  assertEqual(file?.updatedTime, 0, "timestamp after write and read");

  setFile(db, {
    path: "/test.md",
    updatedTime: 1,
  });

  const file2 = getFile(db, "/test.md");

  assertEqual(file2?.updatedTime, 1, "timestamp after update");

  deleteFile(db, "/test.md");

  const file3 = getFile(db, "/test.md");

  assertEqual(file3, undefined, "file after delete");
}

async function testDirtyFlag() {
  const db = await createDbWithSchema();

  setFiles(db, [
    { path: "/test-1.md", updatedTime: 0 },
    { path: "/test-2.md", updatedTime: 0, remoteHash: "test" },
    { path: "/test-3.md", updatedTime: 0, localHash: "test" },
    { path: "/test-4.md", updatedTime: 0, localHash: "test", remoteHash: "test" },
    { path: "/test-5.md", updatedTime: 0, localHash: "test", remoteHash: "test different" },
  ]);

  const [file1, file2, file3, file4, file5] = [1, 2, 3, 4, 5].map((i) => getFile(db, `/test-${i}.md`));

  assertEqual(file1?.isDirty, 0, "same null hash");
  assertEqual(file2?.isDirty, 1, "local null");
  assertEqual(file3?.isDirty, 1, "remote null");
  assertEqual(file4?.isDirty, 0, "same hash");
  assertEqual(file5?.isDirty, 1, "different hash");
}

async function testObjectCRUD() {
  const db = await createDbWithSchema();

  setObject(db, "some-key", { a: 1, b: "", c: null, d: true, e: undefined, f: [], g: {} });
  const result1 = getObject(db, "some-key");
  assertDeepEqual(
    result1,
    { a: 1, b: "", c: null, d: true, e: undefined, f: [], g: {} },
    "object after write and read"
  );

  setObject(db, "some-key", { a: 2 });
  const result2 = getObject(db, "some-key");
  assertDeepEqual(result2, { a: 2 }, "object after update");

  deleteObject(db, "some-key");
  const result3 = getObject(db, "some-key");
  assertEqual(result3, null, "object after delete");
}

async function createDbWithSchema() {
  const db = await sqlite3Mem("./sqlite3/jswasm/");
  db.exec(SCHEMA);
  return db;
}
