import { assertDeepEqual, assertDefined, assertEqual, assertUndefined } from "../../live-test";
import {
  deleteAllFiles,
  getDirtyFiles,
  getFile,
  getRecentFiles,
  searchFiles,
  setLocalFile,
  setLocalFiles,
  setRemoteFile,
  setRemoteFiles,
} from "../file";
import SCHEMA from "../schema.sql";
import { createTestDb } from "./fixture";

export async function testLocalFileEditLifecycle() {
  console.log("[test] localFileEditLifecycle");
  const db = await createTestDb(SCHEMA);

  assertUndefined(getFile(db, "/test.md"), "Before file created");

  // create
  setLocalFile(db, {
    path: "/test.md",
    content: "hello world",
    updatedTime: "2000-01-01T00:00:00Z",
  });

  let file = getFile(db, "/test.md")!;
  assertDefined(file, "After file created");
  assertEqual(file.content, "hello world", "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:00Z", "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.isDirty, 1, "isDirty");

  // edit
  setLocalFile(db, {
    path: "/test.md",
    content: "hello world 2",
    updatedTime: "2000-01-01T00:00:01Z",
  });

  file = getFile(db, "/test.md")!;
  assertEqual(file.content, "hello world 2", "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:01Z", "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.isDirty, 1, "isDirty");

  // soft delete
  setLocalFile(db, {
    path: "/test.md",
    content: null,
    updatedTime: "2000-01-01T00:00:02Z",
  });

  file = getFile(db, "/test.md")!;
  assertEqual(file.content, null, "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:02Z", "Latest time");
  assertEqual(file.isDeleted, 1, "isDelete");
  assertEqual(file.isDirty, 0, "isDirty");

  // hard delete
  deleteAllFiles(db);

  assertUndefined(getFile(db, "/test.md"), "After all files deleted");
}

export async function testLocalFirstSync() {
  console.log("[test] localFirstSync");
  const db = await createTestDb(SCHEMA);

  // create
  setLocalFile(db, {
    path: "/test.md",
    content: "hello world",
    updatedTime: "2000-01-01T00:00:00Z",
  });

  // push
  setRemoteFile(db, {
    path: "/test.md",
    content: "hello world",
    updatedTime: "2000-01-01T00:00:01Z",
  });

  let file = getFile(db, "/test.md")!;

  assertEqual(file.content, "hello world", "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:01Z", "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.isDirty, 0, "isDirty");

  // edit after push
  setLocalFile(db, {
    path: "/test.md",
    content: "hello world 2",
    updatedTime: "2000-01-01T00:00:02Z",
  });

  file = getFile(db, "/test.md")!;

  assertEqual(file.content, "hello world 2", "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:02Z", "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.isDirty, 1, "isDirty");

  // delete after push
  setLocalFile(db, {
    path: "/test.md",
    content: null,
    updatedTime: "2000-01-01T00:00:03Z",
  });

  file = getFile(db, "/test.md")!;

  assertEqual(file.content, null, "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:03Z", "Latest time");
  assertEqual(file.isDeleted, 1, "isDelete");
  assertEqual(file.isDirty, 1, "isDirty");

  // undo all changes after push
  setLocalFile(db, {
    path: "/test.md",
    content: "hello world",
    updatedTime: "2000-01-01T00:00:04Z",
  });

  file = getFile(db, "/test.md")!;

  assertEqual(file.content, "hello world", "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:04Z", "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.isDirty, 0, "isDirty");
}

export async function testRemoteFirstSync() {
  console.log("[test] remoteFirstSync");
  const db = await createTestDb(SCHEMA);

  // remote create
  setRemoteFile(db, {
    path: "/test.md",
    content: "hello world",
    updatedTime: "2000-01-01T00:00:00Z",
  });

  let file = getFile(db, "/test.md")!;
  assertEqual(file.content, "hello world", "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:00Z", "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.isDirty, 0, "isDirty");

  // pull
  setLocalFile(db, {
    path: "/test.md",
    content: "hello world",
    updatedTime: "2000-01-01T00:00:01Z",
  });

  file = getFile(db, "/test.md")!;
  assertEqual(file.content, "hello world", "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:01Z", "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.isDirty, 0, "isDirty");

  // remote edit
  setRemoteFile(db, {
    path: "/test.md",
    content: "hello world 2",
    updatedTime: "2000-01-01T00:00:02Z",
  });

  file = getFile(db, "/test.md")!;
  assertEqual(file.content, "hello world 2", "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:02Z", "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.isDirty, 0, "isDirty");

  // remote delete
  setRemoteFile(db, {
    path: "/test.md",
    content: null,
    updatedTime: "2000-01-01T00:00:03Z",
  });

  file = getFile(db, "/test.md")!;
  assertEqual(file.content, null, "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:03Z", "Latest time");
  assertEqual(file.isDeleted, 1, "isDelete");
  assertEqual(file.isDirty, 0, "isDirty");
}

export async function testConflictRemoteWins() {
  console.log("[text] conflictRemoteWins");
  const db = await createTestDb(SCHEMA);

  // remote time >= local
  setLocalFile(db, {
    path: "/test.md",
    content: "hello world",
    updatedTime: "2000-01-01T00:00:00Z",
  });

  setLocalFile(db, {
    path: "/test.md",
    content: "hello world local version",
    updatedTime: "2000-01-01T00:00:02Z",
  });

  setRemoteFile(db, {
    path: "/test.md",
    content: "hello world remote version",
    updatedTime: "2000-01-01T00:00:02Z",
  });

  let file = getFile(db, "/test.md")!;
  assertEqual(file.content, "hello world remote version", "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:02Z", "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.isDirty, 0, "isDirty");
}

export async function testConflictLocalWins() {
  console.log("[text] conflictLocalWins");
  const db = await createTestDb(SCHEMA);

  // remote time < local
  setLocalFile(db, {
    path: "/test.md",
    content: "hello world",
    updatedTime: "2000-01-01T00:00:00Z",
  });

  setLocalFile(db, {
    path: "/test.md",
    content: "hello world local version",
    updatedTime: "2000-01-01T00:00:02Z",
  });

  setRemoteFile(db, {
    path: "/test.md",
    content: "hello world remote version",
    updatedTime: "2000-01-01T00:00:01Z",
  });

  let file = getFile(db, "/test.md")!;
  assertEqual(file.content, "hello world local version", "Latest content");
  assertEqual(file.updatedTime, "2000-01-01T00:00:02Z", "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.isDirty, 1, "isDirty");
}

export async function testGetRecentFiles() {
  const db = await createTestDb(SCHEMA);

  // prepare files with various sources and timestamps
  setLocalFiles(db, [
    { path: "/file-1.md", content: "", updatedTime: "2000-01-01T00:00:08Z" },
    { path: "/file-2.md", content: "", updatedTime: "2000-01-01T00:00:03Z" },
    { path: "/file-3.md", content: "", updatedTime: "2000-01-01T00:00:05Z" },
  ]);
  setRemoteFiles(db, [
    { path: "/file-4.md", content: "", updatedTime: "2000-01-01T00:00:07Z" },
    { path: "/file-5.md", content: "", updatedTime: "2000-01-01T00:00:09Z" },
    { path: "/file-6.md", content: "", updatedTime: "2000-01-01T00:00:01Z" },
  ]);

  const recentFiles = getRecentFiles(db, 10);
  assertDeepEqual(
    recentFiles.map((f) => f.path),
    ["/file-5.md", "/file-1.md", "/file-4.md", "/file-3.md", "/file-2.md", "/file-6.md"]
  );
}

export async function testGetDirtyFiles() {
  const db = await createTestDb(SCHEMA);

  // prepare files with various sources and timestamps
  setLocalFiles(db, [
    { path: "/file-1.md", content: "", updatedTime: "2000-01-01T00:00:08Z" }, // created
    { path: "/file-2.md", content: "modified", updatedTime: "2000-01-01T00:00:03Z" }, // modified
    { path: "/file-3.md", content: null, updatedTime: "2000-01-01T00:00:05Z" }, // deleted
    { path: "/file-4.md", content: null, updatedTime: "2000-01-01T00:00:05Z" }, // clean (remote deleted last)
    { path: "/file-5.md", content: null, updatedTime: "2000-01-01T00:00:05Z" }, // clean (local deleted last)
    { path: "/file-6.md", content: null, updatedTime: "2000-01-01T00:00:05Z" }, // clean (deleted at same time)
    { path: "/file-7.md", content: "", updatedTime: "2000-01-01T00:00:05Z" }, // clean (remote modified last)
    { path: "/file-8.md", content: "", updatedTime: "2000-01-01T00:00:05Z" }, // clean (local modified last)
  ]);
  setRemoteFiles(db, [
    { path: "/file-2.md", content: "", updatedTime: "2000-01-01T00:00:02Z" },
    { path: "/file-3.md", content: "", updatedTime: "2000-01-01T00:00:04Z" },
    { path: "/file-4.md", content: null, updatedTime: "2000-01-01T00:00:06Z" },
    { path: "/file-5.md", content: null, updatedTime: "2000-01-01T00:00:04Z" },
    { path: "/file-6.md", content: null, updatedTime: "2000-01-01T00:00:05Z" },
    { path: "/file-7.md", content: "", updatedTime: "2000-01-01T00:00:06Z" },
    { path: "/file-8.md", content: "", updatedTime: "2000-01-01T00:00:04Z" },
  ]);

  const dirtyFiles = getDirtyFiles(db);
  assertDeepEqual(dirtyFiles.map((f) => f.path).sort(), ["/file-1.md", "/file-2.md", "/file-3.md"]);
}

export async function testGetDirtyFilesWithIgnore() {
  const db = await createTestDb(SCHEMA);

  // prepare files with various sources and timestamps
  setLocalFiles(db, [
    { path: "file-1.md", content: "", updatedTime: "2000-01-01T00:00:08Z" },
    { path: "file-2.md", content: "", updatedTime: "2000-01-01T00:00:08Z" },
    { path: "dir-1/file.md", content: "", updatedTime: "2000-01-01T00:00:08Z" },
    { path: "dir-1/subdir/file.md", content: "", updatedTime: "2000-01-01T00:00:08Z" },
    { path: "dir-2/file.md", content: "", updatedTime: "2000-01-01T00:00:08Z" },
  ]);

  const dirtyFiles = getDirtyFiles(db);
  assertDeepEqual(dirtyFiles.map((f) => f.path).sort(), [
    "dir-1/file.md",
    "dir-1/subdir/file.md",
    "dir-2/file.md",
    "file-1.md",
    "file-2.md",
  ]);

  const dirtyFilesWithIgnore = getDirtyFiles(db, ["file-2.md", "dir-1/subdir%", "dir-2%"]);
  assertDeepEqual(dirtyFilesWithIgnore.map((f) => f.path).sort(), ["dir-1/file.md", "file-1.md"]);
}

export async function testBulkOperations() {
  const db = await createTestDb(SCHEMA);

  setLocalFiles(db, []); // empty
  setRemoteFiles(db, []); // empty
}

export async function testMetaCRUD() {
  console.log("[text] metaCRUD");
  const db = await createTestDb(SCHEMA);

  setLocalFile(db, { path: "/meta-undefined.md", content: "", updatedTime: "2000-01-01T00:00:00Z" });
  assertDeepEqual(getFile(db, "/meta-undefined.md")!.meta, {}, "undefined meta");

  setLocalFile(db, { path: "/meta-empty.md", content: "", meta: {}, updatedTime: "2000-01-01T00:00:00Z" });
  assertDeepEqual(getFile(db, "/meta-empty.md")!.meta, {}, "empty meta");

  setLocalFile(db, {
    path: "/meta-extended.md",
    content: "",
    meta: { hello: 42, world: true },
    updatedTime: "2000-01-01T00:00:00Z",
  });
  assertDeepEqual(getFile(db, "/meta-extended.md")!.meta, { hello: 42, world: true }, "extended meta");

  setLocalFiles(db, [
    { path: "/file-2.md", content: "", meta: { title: "title 2" }, updatedTime: "2000-01-01T00:00:00Z" },
  ]);

  setRemoteFiles(db, [
    { path: "/file-3.md", content: "", meta: { title: "title 3" }, updatedTime: "2000-01-01T00:00:00Z" },
  ]);

  const recentFiles = getRecentFiles(db, 10);
  assertEqual(recentFiles.find((f) => f.path === "/file-2.md")!.meta.title, "title 2", "title 2");
  assertEqual(recentFiles.find((f) => f.path === "/file-3.md")!.meta.title, "title 3", "title 3");

  const dirtyFiles = getDirtyFiles(db);
  assertEqual(dirtyFiles.find((f) => f.path === "/file-2.md")!.meta.title, "title 2", "title 2");
}

export async function testSearchMeta() {
  console.log("[test] searchMeta");
  const db = await createTestDb(SCHEMA);

  setLocalFiles(db, [
    { path: "/node-1", content: "", meta: { title: "hello world" }, updatedTime: "2000-01-01T00:00:00Z" },
    { path: "/node-2", content: "", meta: { title: "OK Computer" }, updatedTime: "2000-01-01T00:00:00Z" },
    { path: "/node-3", content: "", meta: { title: "random stuff" }, updatedTime: "2000-01-01T00:00:00Z" },
  ]);

  console.log("[test] searchMeta/empty");
  const emptyResults = searchFiles(db, { query: "nothing should show up", limit: 10 });
  assertEqual(emptyResults.length, 0, "No result");

  console.log("[test] searchMeta/simple");
  const simpleResults = searchFiles(db, { query: "hello", limit: 10 });
  assertEqual(simpleResults.length, 1, "Exactly one result");
  assertEqual(simpleResults[0].path, "/node-1", "Path matches");
  assertEqual(simpleResults[0].meta.title, "hello world", "Title matches");

  console.log("[test] searchMeta/caseInsensitive");
  const caseInsensitiveResult = searchFiles(db, { query: "oK comPUtEr", limit: 10 });
  assertEqual(caseInsensitiveResult.length, 1, "Exactly one result");
  assertEqual(caseInsensitiveResult[0].meta.title, "OK Computer", "Title matches");
}

export async function testSearchFileContent() {
  console.log("[test] searchFiles");
  const db = await createTestDb(SCHEMA);

  setLocalFiles(db, [
    { path: "/file-1.md", content: "hello world", updatedTime: "2000-01-01T00:00:00Z" },
    { path: "/file-3.md", content: "OK Computer", updatedTime: "2000-01-01T00:00:00Z" },
  ]);
  setRemoteFiles(db, [{ path: "/file-2.md", content: "random stuff", updatedTime: "2000-01-01T00:00:00Z" }]);
  setRemoteFiles(db, [{ path: "/file-4.md", content: "fancy content", updatedTime: "2000-01-01T00:00:00Z" }]);

  console.log("[test] fileSearch/empty");
  const emptyResults = searchFiles(db, { query: "nothing should show up", limit: 10 });
  assertEqual(emptyResults.length, 0, "No result");

  console.log("[test] fileSearch/simple");
  const simpleResults = searchFiles(db, { query: "hello", limit: 10 });
  assertEqual(simpleResults.length, 1, "Exactly one result");
  assertEqual(simpleResults[0].path, "/file-1.md", "Path matches");
  assertEqual(simpleResults[0].content, "hello world", "Title matches");

  console.log("[test] fileSearch/caseInsensitive");
  const caseInsensitiveResult = searchFiles(db, { query: "oK comPUtEr", limit: 10 });
  assertEqual(caseInsensitiveResult.length, 1, "Exactly one result");
  assertEqual(caseInsensitiveResult[0].content, "OK Computer", "Title matches");

  console.log("[test] fileSearch/additionalFields");
  const additionalFieldsResult = searchFiles(db, { query: "fancy", limit: 10 });
  assertEqual(additionalFieldsResult[0].updatedTime, "2000-01-01T00:00:00Z", "Updated time matches");
}
