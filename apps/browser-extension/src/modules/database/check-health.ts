import { sqlite3Mem } from "@tinykb/sqlite-utils";
import { assertDeepEqual, assertDefined, assertEqual, assertUndefined } from "../live-test";
import { deleteAllFiles, deleteFile, getFile, setFile, setFiles } from "./file";
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
    await runSpec("File dirty flag", testFileDirtyFlag);
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

  setFile(db, {
    path: "/test.md",
    updatedTime: 0,
    content: "",
  });

  const file = getFile(db, "/test.md");

  assertEqual(file?.path, "/test.md", "path after write and read");
  assertEqual(file?.updatedTime, 0, "timestamp after write and read");

  setFile(db, {
    path: "/test.md",
    updatedTime: 1,
    content: "",
  });

  const file2 = getFile(db, "/test.md");

  assertEqual(file2?.updatedTime, 1, "timestamp after update");

  deleteFile(db, "/test.md");

  const file3 = getFile(db, "/test.md");

  assertEqual(file3, undefined, "file after delete");

  setFiles(db, [
    { path: "/test-1.md", updatedTime: 0, content: "" },
    { path: "/test-2.md", updatedTime: 0, content: "" },
  ]);

  assertDefined(getFile(db, "/test-1.md"), "test-1 after setFiles");
  assertDefined(getFile(db, "/test-2.md"), "test-2 after setFiles");

  deleteAllFiles(db);

  assertUndefined(getFile(db, "/test-1.md"), "test-1 after deleteAllFiles");
  assertUndefined(getFile(db, "/test-2.md"), "test-2 after deleteAllFiles");
}

async function testFileSoftDelete() {
  const db = await createDbWithSchema();

  setFile(db, {
    path: "/test.md",
    updatedTime: 0,
    content: "",
  });

  assertEqual(getFile(db, "/test.md")?.isDeleted, 0, "test.md isDeleted before delete");

  setFile(db, {
    path: "/test.md",
    updatedTime: 1,
    content: null,
  });

  assertEqual(getFile(db, "/test.md")?.isDeleted, 1, "test.md isDeleted after delete");
}

async function testFileDirtyFlag() {
  const db = await createDbWithSchema();

  setFiles(db, [
    { path: "/test-1.md", updatedTime: 0, content: null },
    { path: "/test-2.md", updatedTime: 0, content: null, remoteHash: "test" },
    { path: "/test-3.md", updatedTime: 0, content: "", localHash: "test" },
    { path: "/test-4.md", updatedTime: 0, content: "", localHash: "test", remoteHash: "test" },
    { path: "/test-5.md", updatedTime: 0, content: "", localHash: "test", remoteHash: "test different" },
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
