import { sqlite3Mem } from "@tinykb/sqlite-utils";
import { assertDeepEqual, assertDefined, assertEqual, assertUndefined } from "../live-test";
import { deleteAllFiles, deleteFile, getFile, setLocalFile, setSyncedFile, setSyncedFiles } from "./file";
import { deleteAllObjects, deleteObject, getObject, setObject } from "./object";
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
    await runSpec("Schema", testSchema);
    await runSpec("File CRUD", testFileCRUD);
    await runSpec("File status tracking", testFileStatusTracking);
    await runSpec("File soft delete", testFileSoftDelete);
    await runSpec("Object CRUD", testObjectCRUD);
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

  setSyncedFile(db, {
    path: "/test.md",
    content: "",
  });

  const file = getFile(db, "/test.md");

  assertEqual(file?.path, "/test.md", "path after write and read");
  assertEqual(file?.content, "", "content after write and read");

  setSyncedFile(db, {
    path: "/test.md",
    content: "updated",
  });

  const file2 = getFile(db, "/test.md");

  assertEqual(file2?.content, "updated", "timestamp after update");

  deleteFile(db, "/test.md");

  const file3 = getFile(db, "/test.md");

  assertEqual(file3, undefined, "file after delete");

  setSyncedFiles(db, [
    { path: "/test-1.md", content: "" },
    { path: "/test-2.md", content: "" },
  ]);

  assertDefined(getFile(db, "/test-1.md"), "test-1 after setFiles");
  assertDefined(getFile(db, "/test-2.md"), "test-2 after setFiles");

  deleteAllFiles(db);

  assertUndefined(getFile(db, "/test-1.md"), "test-1 after deleteAllFiles");
  assertUndefined(getFile(db, "/test-2.md"), "test-2 after deleteAllFiles");
}

async function testFileSoftDelete() {
  const db = await createDbWithSchema();

  setSyncedFile(db, {
    path: "/test.md",
    updatedTime: new Date().toISOString(),
    content: "",
  });

  assertEqual(getFile(db, "/test.md")?.isDeleted, 0, "test.md isDeleted before delete");

  setSyncedFile(db, {
    path: "/test.md",
    updatedTime: new Date().toISOString(),
    content: null,
  });

  assertEqual(getFile(db, "/test.md")?.isDeleted, 1, "test.md isDeleted after delete");
}

async function testFileStatusTracking() {
  const db = await createDbWithSchema();

  setSyncedFile(db, { path: "/file-1.md", updatedTime: "2000-01-01T00:00:00", content: "" });
  assertEqual(getFile(db, `/file-${1}.md`)?.isDirty, 0, "test-1 is clean");

  setLocalFile(db, { path: "/file-1.md", updatedTime: "2000-01-01T00:00:01", content: "" });
  assertEqual(getFile(db, `/file-${1}.md`)?.isDirty, 1, "test-1 is ahead");

  setSyncedFile(db, { path: "/file-1.md", updatedTime: "2000-01-01T00:00:02", content: "" });
  assertEqual(getFile(db, `/file-${1}.md`)?.isDirty, 0, "test-1 is clean");

  setLocalFile(db, { path: "/file-1.md", updatedTime: "2000-01-01T00:00:03", content: null });
  assertEqual(getFile(db, `/file-${1}.md`)?.isDirty, 1, "test-1 is ahead");

  setSyncedFile(db, { path: "/file-1.md", updatedTime: "2000-01-01T00:00:04", content: null });
  assertEqual(getFile(db, `/file-${1}.md`)?.isDirty, 0, "test-1 is clean");
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
  assertEqual(result3, undefined, "object after delete");

  setObject(db, "obj-1", { a: 1 });
  setObject(db, "obj-2", { a: 1 });
  assertDefined(getObject(db, "obj-1"), "obj-1 is defined");
  assertDefined(getObject(db, "obj-2"), "obj-2 is defined");
  deleteAllObjects(db);
  assertUndefined(getObject(db, "obj-1"), "obj-1 is undefined after clear");
  assertUndefined(getObject(db, "obj-2"), "obj-2 is undefined after clear");
}

async function createDbWithSchema() {
  const db = await sqlite3Mem("./sqlite3/jswasm/");
  db.exec(SCHEMA);
  return db;
}
