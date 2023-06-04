import { assertDeepEqual, assertDefined, assertEqual, assertUndefined } from "../../live-test";
import {
  deleteAllFiles,
  getDirtyFiles,
  getFile,
  getRecentFiles,
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
