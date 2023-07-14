import { assertDeepEqual, assertDefined, assertEqual, assertUndefined } from "../../live-test";
import {
  deleteFiles,
  getDirtyFiles,
  getFile,
  getRecentFiles,
  searchFiles,
  updateLocal,
  updateRemote,
  updateSynced,
} from "../graph";
import { DbFileV2Status } from "../schema";
import SCHEMA from "../schema.sql";
import { createTestDb } from "./fixture";

export async function testLocalFileEditLifecycle() {
  const db = await createTestDb(SCHEMA);

  assertUndefined(getFile(db, "/test.md"), "Before file created");

  // create
  updateLocal(db, {
    path: "/test.md",
    content: "hello world",
    updatedAt: 1,
  });

  let file = getFile(db, "/test.md")!;
  assertDefined(file, "After file created");
  assertEqual(file.content, "hello world", "Latest content");
  assertEqual(file.updatedAt, 1, "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.status, DbFileV2Status.Ahead, "is ahead");

  // edit
  updateLocal(db, {
    path: "/test.md",
    content: "hello world 2",
    updatedAt: 2,
  });

  file = getFile(db, "/test.md")!;
  assertEqual(file.content, "hello world 2", "Latest content");
  assertEqual(file.updatedAt, 2, "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.status, DbFileV2Status.Ahead, "is ahead");

  // delete
  deleteFiles(db, ["/test.md"]);

  assertUndefined(getFile(db, "/test.md"), "After all files deleted");
}

export async function testLocalFirstSync() {
  const db = await createTestDb(SCHEMA);

  // create
  updateLocal(db, {
    path: "/test.md",
    content: "hello world",
    updatedAt: 1,
  });

  // push
  updateSynced(db, {
    path: "/test.md",
    content: "hello world",
    updatedAt: 2,
  });

  let file = getFile(db, "/test.md")!;

  assertEqual(file.content, "hello world", "Latest content");
  assertEqual(file.updatedAt, 2, "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.status, DbFileV2Status.Synced, "is synced");

  // edit after push
  updateLocal(db, {
    path: "/test.md",
    content: "hello world 2",
    updatedAt: 3,
  });

  file = getFile(db, "/test.md")!;

  assertEqual(file.content, "hello world 2", "Latest content");
  assertEqual(file.updatedAt, 3, "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.status, DbFileV2Status.Ahead, "is ahead");

  // delete after push
  updateLocal(db, {
    path: "/test.md",
    content: null,
    updatedAt: 4,
  });

  file = getFile(db, "/test.md")!;

  assertEqual(file.content, null, "Latest content");
  assertEqual(file.updatedAt, 4, "Latest time");
  assertEqual(file.isDeleted, 1, "isDelete");
  assertEqual(file.status, DbFileV2Status.Ahead, "is ahead");

  // undo all changes after push
  updateLocal(db, {
    path: "/test.md",
    content: "hello world",
    updatedAt: 5,
  });

  file = getFile(db, "/test.md")!;

  assertEqual(file.content, "hello world", "Latest content");
  assertEqual(file.updatedAt, 2, "Latest time"); // clock rewind
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.status, DbFileV2Status.Synced, "is synced");
}

export async function testDeleteFiles() {
  const db = await createTestDb(SCHEMA);

  updateLocal(db, [
    { path: "file-1.md", content: "", updatedAt: 4 },
    { path: "dir1/file-2.md", content: "", updatedAt: 9 },
    { path: "dir1/file-3.md", content: "", updatedAt: 9 },
    { path: "dir2/subdir/file-4.md", content: "", updatedAt: 9 },
  ]);

  assertEqual(getFile(db, "file-1.md")?.path, "file-1.md", "file-1.md");
  deleteFiles(db, ["file-1.md"]);
  assertEqual(getFile(db, "file-1.md"), undefined, "file-1.md");

  assertEqual(getFile(db, "dir1/file-2.md")?.path, "dir1/file-2.md", "dir1/file-2.md");
  assertEqual(getFile(db, "dir1/file-3.md")?.path, "dir1/file-3.md", "dir1/file-3.md");
  deleteFiles(db, ["dir1*"]);
  assertEqual(getFile(db, "dir1/file-2.md"), undefined, "dir1/file-2.md");
  assertEqual(getFile(db, "dir1/file-3.md"), undefined, "dir1/file-3.md");

  assertEqual(getFile(db, "dir2/subdir/file-4.md")?.path, "dir2/subdir/file-4.md", "dir2/subdir/file-4.md");
  deleteFiles(db, ["dir2/*"]);
  assertEqual(getFile(db, "dir2/subdir/file-4.md"), undefined, "dir2/subdir/file-4.md");
}

export async function testRemoteFirstSync() {
  const db = await createTestDb(SCHEMA);

  // remote create
  updateRemote(db, {
    path: "/test.md",
    content: "hello world",
    updatedAt: 1,
  });

  let file = getFile(db, "/test.md")!;
  assertEqual(file.content, null, "Latest content");
  assertEqual(file.updatedAt, null, "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.status, DbFileV2Status.Behind, "is behind");

  // pull
  updateSynced(db, {
    path: "/test.md",
    content: "hello world",
    updatedAt: 2,
  });

  file = getFile(db, "/test.md")!;
  assertEqual(file.content, "hello world", "Latest content");
  assertEqual(file.updatedAt, 2, "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.status, DbFileV2Status.Synced, "is synced");

  // remote edit
  updateRemote(db, {
    path: "/test.md",
    content: "hello world 2",
    updatedAt: 3,
  });

  file = getFile(db, "/test.md")!;
  assertEqual(file.content, "hello world", "Latest content");
  assertEqual(file.updatedAt, 2, "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.status, DbFileV2Status.Behind, "is behind");

  // pull edit
  updateSynced(db, {
    path: "/test.md",
    content: "hello world 2",
    updatedAt: 3,
  });

  file = getFile(db, "/test.md")!;
  assertEqual(file.content, "hello world 2", "Latest content");
  assertEqual(file.updatedAt, 3, "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.status, DbFileV2Status.Synced, "is synced");

  // remote delete
  updateSynced(db, {
    path: "/test.md",
    content: null,
    updatedAt: 4,
  });

  file = getFile(db, "/test.md")!;
  assertUndefined(file, "Latest content");
}

export async function testSyncOverrideLocal() {
  const db = await createTestDb(SCHEMA);

  // remote time >= local
  updateLocal(db, {
    path: "/test.md",
    content: "hello world",
    updatedAt: 1,
  });

  updateLocal(db, {
    path: "/test.md",
    content: "hello world local version",
    updatedAt: 3,
  });

  updateSynced(db, {
    path: "/test.md",
    content: "hello world remote version",
    updatedAt: 3,
  });

  let file = getFile(db, "/test.md")!;
  assertEqual(file.content, "hello world remote version", "Latest content");
  assertEqual(file.updatedAt, 3, "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.status, DbFileV2Status.Synced, "is synced");
}

export async function testLocalOverrideSync() {
  const db = await createTestDb(SCHEMA);

  // remote time < local
  updateLocal(db, {
    path: "/test.md",
    content: "hello world",
    updatedAt: 1,
  });

  updateLocal(db, {
    path: "/test.md",
    content: "hello world local version",
    updatedAt: 3,
  });

  updateSynced(db, {
    path: "/test.md",
    content: "hello world remote version",
    updatedAt: 2,
  });

  let file = getFile(db, "/test.md")!;
  assertEqual(file.content, "hello world local version", "Latest content");
  assertEqual(file.updatedAt, 3, "Latest time");
  assertEqual(file.isDeleted, 0, "isDelete");
  assertEqual(file.status, DbFileV2Status.Ahead, "is ahead");
}

export async function testGetRecentFiles() {
  const db = await createTestDb(SCHEMA);

  // prepare files with various sources and timestamps
  updateLocal(db, [
    { path: "file-1.md", content: "", updatedAt: 9 },
    { path: "file-2.md", content: "", updatedAt: 4 },
    { path: "file-3.md", content: "", updatedAt: 6 },
  ]);
  updateSynced(db, [
    { path: "file-4.md", content: "", updatedAt: 8 },
    { path: "file-5.md", content: "", updatedAt: 10 },
    { path: "file-6.md", content: "", updatedAt: 2 },
  ]);

  const recentFiles = getRecentFiles(db, { limit: 10 });
  assertDeepEqual(
    recentFiles.map((f) => f.path),
    ["file-5.md", "file-1.md", "file-4.md", "file-3.md", "file-2.md", "file-6.md"]
  );
}

export async function testGetRecentFilesWithScope() {
  const db = await createTestDb(SCHEMA);

  // prepare files with various sources and timestamps
  updateLocal(db, [
    { path: "dir1/file-1.md", content: "", updatedAt: 9 },
    { path: "dir1/file-2.md", content: "", updatedAt: 4 },
    { path: "dir2/file-3.md", content: "", updatedAt: 6 },
    { path: "dir2/file-4.md", content: "", updatedAt: 7 },
  ]);

  const recentFilesDir1 = getRecentFiles(db, { limit: 10, paths: ["dir2/*"] });
  assertDeepEqual(
    recentFilesDir1.map((f) => f.path),
    ["dir2/file-4.md", "dir2/file-3.md"]
  );
}

export async function testGetRecentFilesWithIgnore() {
  const db = await createTestDb(SCHEMA);

  // prepare files with various sources and timestamps
  updateLocal(db, [
    { path: "dir1/file-1.md", content: "", updatedAt: 9 },
    { path: "dir1/file-2.md", content: "", updatedAt: 4 },
    { path: "dir2/file-3.md", content: "", updatedAt: 6 },
    { path: "dir2/file-4.md", content: "", updatedAt: 7 },
  ]);

  const recentFilesDir1 = getRecentFiles(db, { limit: 10, ignore: ["dir1/*"] });
  assertDeepEqual(
    recentFilesDir1.map((f) => f.path),
    ["dir2/file-4.md", "dir2/file-3.md"]
  );
}

export async function testGetDirtyFiles() {
  const db = await createTestDb(SCHEMA);

  updateSynced(db, [
    { path: "file-2.md", content: "", updatedAt: 3 },
    { path: "file-3.md", content: "", updatedAt: 5 },
    { path: "file-5.md", content: null, updatedAt: 5 },
    { path: "file-6.md", content: null, updatedAt: 6 },
    { path: "file-8.md", content: "", updatedAt: 5 },
  ]);

  // prepare files with various sources and timestamps
  updateLocal(db, [
    { path: "file-1.md", content: "", updatedAt: 9 }, // created
    { path: "file-2.md", content: "modified", updatedAt: 4 }, // modified
    { path: "file-3.md", content: null, updatedAt: 6 }, // deleted
    { path: "file-4.md", content: null, updatedAt: 6 }, // clean (remote deleted last)
    { path: "file-5.md", content: null, updatedAt: 6 }, // clean (local deleted last)
    { path: "file-6.md", content: null, updatedAt: 6 }, // clean (deleted at same time)
    { path: "file-7.md", content: "", updatedAt: 6 }, // clean (remote modified last)
    { path: "file-8.md", content: "", updatedAt: 6 }, // clean (local modified last)
  ]);

  updateSynced(db, [
    { path: "file-4.md", content: null, updatedAt: 7 },
    { path: "file-7.md", content: "", updatedAt: 7 },
  ]);

  const dirtyFiles = getDirtyFiles(db);
  assertDeepEqual(dirtyFiles.map((f) => f.path).sort(), ["file-1.md", "file-2.md", "file-3.md"]);
}

export async function testGetDirtyFilesWithIgnore() {
  const db = await createTestDb(SCHEMA);

  // prepare files with various sources and timestamps
  updateLocal(db, [
    { path: "file-1.md", content: "", updatedAt: 9 },
    { path: "file-2.md", content: "", updatedAt: 9 },
    { path: "dir-1/file.md", content: "", updatedAt: 9 },
    { path: "dir-1/subdir/file.md", content: "", updatedAt: 9 },
    { path: "dir-2/file.md", content: "", updatedAt: 9 },
  ]);

  const dirtyFiles = getDirtyFiles(db);
  assertDeepEqual(dirtyFiles.map((f) => f.path).sort(), [
    "dir-1/file.md",
    "dir-1/subdir/file.md",
    "dir-2/file.md",
    "file-1.md",
    "file-2.md",
  ]);

  const dirtyFilesWithIgnore = getDirtyFiles(db, ["file-2.md*", "dir-1/subdir*", "dir-2*"]);
  assertDeepEqual(dirtyFilesWithIgnore.map((f) => f.path).sort(), ["dir-1/file.md", "file-1.md"]);
}

export async function testBulkOperations() {
  const db = await createTestDb(SCHEMA);

  updateLocal(db, []); // empty
  updateSynced(db, []); // empty
}

export async function testMetaCRUD() {
  const db = await createTestDb(SCHEMA);

  updateSynced(db, { path: "/no-content-meta.md", content: "", updatedAt: 1 });
  updateLocal(db, { path: "/no-content-meta.md", content: null, updatedAt: 2 });
  assertDeepEqual(getFile(db, "/no-content-meta.md")!.meta, null, "deleted file meta");

  updateLocal(db, { path: "/meta-undefined.md", content: "", updatedAt: 1 });
  assertDeepEqual(getFile(db, "/meta-undefined.md")!.meta, {}, "undefined meta");

  updateLocal(db, { path: "/meta-empty.md", content: "---\n---", updatedAt: 1 });
  assertDeepEqual(getFile(db, "/meta-empty.md")!.meta, {}, "empty meta");

  updateLocal(db, { path: "/unsupported-type.exe", content: "---\n---", updatedAt: 1 });
  assertDeepEqual(getFile(db, "/unsupported-type.exe")!.meta, {}, "unsupported type");

  updateSynced(db, { path: "/unsupported-type-deleted.exe", content: "", updatedAt: 1 });
  updateLocal(db, { path: "/unsupported-type-deleted.exe", content: null, updatedAt: 2 });
  assertDeepEqual(getFile(db, "/unsupported-type-deleted.exe")!.meta, null, "unsupported type deleted");

  updateLocal(db, {
    path: "/meta-extended.md",
    content: "---\nhello: 42\nworld: true\n---\n",
    updatedAt: 1,
  });
  assertDeepEqual(getFile(db, "/meta-extended.md")!.meta, {}, "extended meta is ignored");

  updateLocal(db, [{ path: "file-2.md", content: "---\ntitle: title 2\n---", updatedAt: 1 }]);
  updateSynced(db, [{ path: "file-3.md", content: "---\ntitle: title 3\n---", updatedAt: 1 }]);

  const recentFiles = getRecentFiles(db, { limit: 10 });
  assertEqual(recentFiles.find((f) => f.path === "file-2.md")!.meta.title, "title 2", "title 2");
  assertEqual(recentFiles.find((f) => f.path === "file-3.md")!.meta.title, "title 3", "title 3");

  const dirtyFiles = getDirtyFiles(db);
  assertEqual(dirtyFiles.find((f) => f.path === "file-2.md")!.meta.title, "title 2", "title 2");
}

export async function testSearchMeta() {
  const db = await createTestDb(SCHEMA);

  updateLocal(db, [
    { path: "node-1.md", content: "---\ntitle: hello world\n---", updatedAt: 1 },
    { path: "node-2.md", content: "---\ntitle: OK Computer\n---", updatedAt: 1 },
    { path: "node-3.md", content: "---\ntitle: random stuff\n---", updatedAt: 1 },
  ]);

  console.log("[test] searchMeta/empty");
  const emptyResults = searchFiles(db, { query: "nothing should show up", limit: 10 });
  assertEqual(emptyResults.length, 0, "No result");

  console.log("[test] searchMeta/simple");
  const simpleResults = searchFiles(db, { query: "hello", limit: 10 });
  assertEqual(simpleResults.length, 1, "Exactly one result");
  assertEqual(simpleResults[0].path, "node-1.md", "Path matches");
  assertEqual(simpleResults[0].meta.title, "hello world", "Title matches");

  console.log("[test] searchMeta/caseInsensitive");
  const caseInsensitiveResult = searchFiles(db, { query: "oK comPUtEr", limit: 10 });
  assertEqual(caseInsensitiveResult.length, 1, "Exactly one result");
  assertEqual(caseInsensitiveResult[0].meta.title, "OK Computer", "Title matches");
}

export async function testSearchFileContent() {
  const db = await createTestDb(SCHEMA);

  updateLocal(db, [
    { path: "file-1.md", content: "hello world", updatedAt: 1 },
    { path: "file-3.md", content: "OK Computer", updatedAt: 1 },
  ]);
  updateSynced(db, [{ path: "file-2.md", content: "random stuff", updatedAt: 1 }]);
  updateSynced(db, [{ path: "file-4.md", content: "fancy content", updatedAt: 1 }]);

  console.log("[test] fileSearch/empty");
  const emptyResults = searchFiles(db, { query: "nothing should show up", limit: 10 });
  assertEqual(emptyResults.length, 0, "No result");

  console.log("[test] fileSearch/simple");
  const simpleResults = searchFiles(db, { query: "hello", limit: 10 });
  assertEqual(simpleResults.length, 1, "Exactly one result");
  assertEqual(simpleResults[0].path, "file-1.md", "Path matches");
  assertEqual(simpleResults[0].content, "hello world", "Title matches");

  console.log("[test] fileSearch/caseInsensitive");
  const caseInsensitiveResult = searchFiles(db, { query: "oK comPUtEr", limit: 10 });
  assertEqual(caseInsensitiveResult.length, 1, "Exactly one result");
  assertEqual(caseInsensitiveResult[0].content, "OK Computer", "Title matches");

  console.log("[test] fileSearch/additionalFields");
  const additionalFieldsResult = searchFiles(db, { query: "fancy", limit: 10 });
  assertEqual(additionalFieldsResult[0].updatedAt, 1, "Updated time matches");

  console.log("[test] fileSearch/ignore");
  const ignoreMatchResults = searchFiles(db, { query: "hello", limit: 10, ignore: ["file-1.md"] });
  const ignoreNoMatchResults = searchFiles(db, { query: "hello", limit: 10, ignore: ["file-2.md"] });
  assertEqual(ignoreMatchResults.length, 0, "No result");
  assertEqual(ignoreNoMatchResults.length, 1, "Exactly one result");

  console.log("[test] fileSearch/scoped");
  updateLocal(db, [
    { path: "dir1/a.md", content: "red", updatedAt: 1 },
    { path: "dir1/b.md", content: "blue", updatedAt: 1 },
    { path: "dir2/c.md", content: "red", updatedAt: 1 },
    { path: "dir2/d.md", content: "blue", updatedAt: 1 },
  ]);
  const inScopePosResults = searchFiles(db, { query: "red", limit: 10, paths: ["dir1*"] });
  const inScopeNegResults = searchFiles(db, { query: "green", limit: 10, paths: ["dir1*"] });
  const outOfScopeResults = searchFiles(db, { query: "red", limit: 10, paths: ["dir3*"] });
  const outOfScopeNegResults = searchFiles(db, { query: "green", limit: 10, paths: ["dir2*"] });
  const multiScopeResults = searchFiles(db, { query: "red", limit: 10, paths: ["dir1*", "dir2*"] });
  assertEqual(inScopePosResults[0]?.path, "dir1/a.md", "Exactly one result");
  assertEqual(inScopeNegResults.length, 0, "in scope no result");
  assertEqual(outOfScopeResults.length, 0, "out of scope exclude result");
  assertEqual(outOfScopeNegResults.length, 0, "out of scope no result");
  assertEqual(multiScopeResults.length, 2, "multi scope result");
}
