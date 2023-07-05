import { arrayToParams, paramsToBindings } from "@tinykb/sqlite-utils";
import { assertDefined, assertThrows, assertUndefined } from "../../live-test";
import { DbFileStatus } from "../schema";
import SCHEMA from "../schema.sql";
import {
  assertFileSourceless,
  assertFileStatus,
  assertFileUntracked,
  assertFileUpdatedAt,
  createTestDb,
  currentFile,
  fsm,
  mockFile,
  newFile,
  selectFile,
  upsertFile,
} from "./fixture";

export async function testFileV2Db() {
  const db = await createTestDb(SCHEMA);
  assertDefined(db, "db is defined");
}

export async function testFileV2FSM() {
  const db = await createTestDb(SCHEMA);
  fsm(db, ".. .. .. | .. .. .. | .. .. ..");
  fsm(db, ".. .. .. | .. .. c1 | .. .. c1");
  fsm(db, ".. .. .. | .. .. .1 | .. .. ..");
  fsm(db, ".. .. .. | a1 .. .. | a1 .. ..");
  fsm(db, ".. .. .. | .1 .. .. | .. .. ..");
  fsm(db, ".. .. .. | .. b1 .. | .. b1 ..");
  fsm(db, ".. .. .. | .. .1 .. | .. .. ..");
}

export async function testFileV2StatusUntracked() {
  const db = await createTestDb(SCHEMA);

  console.log("[test] untracked > setS(content) > synced");

  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);

  console.log("[test] untracked > setS(null) > untracked ");
  upsertFile(db, { path: newFile(), synced: mockFile(1, null) });
  assertUndefined(selectFile(db, currentFile()));

  console.log("[test] untracked > setL(content) > ahead");
  upsertFile(db, { path: newFile(), local: mockFile(1, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Ahead);

  console.log("[test] untracked > setL(null) > untracked");
  upsertFile(db, { path: newFile(), local: mockFile(1, null) });
  assertUndefined(selectFile(db, currentFile()));

  console.log("[test] untracked > setR(content) > behind");
  upsertFile(db, { path: newFile(), remote: mockFile(1, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);

  console.log("[test] untracked > setR(null) > untracked");
  upsertFile(db, { path: newFile(), remote: mockFile(1, null) });
  assertUndefined(selectFile(db, currentFile()));
}

export async function testFileV2StatusSynced() {
  const db = await createTestDb(SCHEMA);

  console.log("[test] synced > setS(same content) > synced");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), synced: mockFile(2, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] synced > setS(different content) > synced");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), synced: mockFile(2, "new") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] synced > setS(null) > untracked");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), synced: mockFile(2, null) });
  assertFileUntracked(db, currentFile());

  console.log("[test] synced > setL(same content) > synced");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] synced > setL(different content) > ahead");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "new") });
  assertFileStatus(db, currentFile(), DbFileStatus.Ahead);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] synced > setL(null) > ahead");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, null) });
  assertFileStatus(db, currentFile(), DbFileStatus.Ahead);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] synced > setR(same content) > synced");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] synced > setR(different content) > behind");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "new") });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] synced > setR(null) > behind");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, null) });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileUpdatedAt(db, currentFile(), 1);
}

export async function testFileV2StatusBehind() {
  const db = await createTestDb(SCHEMA);

  console.log("[test] behind (synced null, remote non-null) > setL(different from remote) > conflict");
  upsertFile(db, { path: newFile(), remote: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "local") });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] behind (synced null, remote non-null) > setL(same as remote) > behind");
  upsertFile(db, { path: newFile(), remote: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileSourceless(db, currentFile());

  console.log("[test] behind (synced null, remote non-null) > setL(null) > conflict");
  upsertFile(db, { path: newFile(), remote: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, null) });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] behind (synced non-null, remote null) > setL(same as synced) > conflict");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), local: mockFile(3, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 3);

  console.log("[test] behind (synced non-null, remote null) > setL(different from synced) > conflict");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), local: mockFile(3, "local") });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 3);

  console.log("[test] behind (synced non-null, remote null) > setL(null) > behind");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), local: mockFile(3, null) });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] behind (synced non-null, remote non-null) > setL(same as synced) > conflict");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "remote") });
  upsertFile(db, { path: currentFile(), local: mockFile(3, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 3);

  console.log("[test] behind (synced non-null, remote non-null) > setL(same as remote) > behind");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "remote") });
  upsertFile(db, { path: currentFile(), local: mockFile(3, "remote") });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] behind (synced non-null, remote non-null) > setL(different) > conflict");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "remote") });
  upsertFile(db, { path: currentFile(), local: mockFile(3, "local") });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 3);

  console.log("[test] behind (synced non-null, remote non-null) > setL(null) > conflict");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "remote") });
  upsertFile(db, { path: currentFile(), local: mockFile(3, null) });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 3);

  console.log("[test] behind (synced null, remote non-null) > setR(different from remote) > behind");
  upsertFile(db, { path: newFile(), remote: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "remote") });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileSourceless(db, currentFile());

  console.log("[test] behind (synced null, remote non-null) > setR(same as remote) > behind");
  upsertFile(db, { path: newFile(), remote: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileSourceless(db, currentFile());

  console.log("[test] behind (synced null, remote non-null) > setR(null) > untracked");
  upsertFile(db, { path: newFile(), remote: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, null) });
  assertFileUntracked(db, currentFile());

  console.log("[test] behind (synced non-null, remote null) > setR(same as synced) > synced");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);
  assertFileUpdatedAt(db, currentFile(), 3);

  console.log("[test] behind (synced non-null, remote null) > setR(different from synced) > behind");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, "remote") });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] behind (synced non-null, remote null) > setR(null) > behind");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, null) });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] behind (synced non-null, remote non-null) > setR(same as synced) > synced");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "remote") });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);
  assertFileUpdatedAt(db, currentFile(), 3);

  console.log("[test] behind (synced non-null, remote non-null) > setR(same as remote) > behind");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "remote") });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, "remote") });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] behind (synced non-null, remote non-null) > setR(different) > behind");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "remote") });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, "local") });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] behind (synced non-null, remote non-null) > setR(null) > behind");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "remote") });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, null) });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] behind (synced null, remote non-null) -> setS(same as remote) -> synced");
  upsertFile(db, { path: newFile(), remote: mockFile(1, "remote") });
  upsertFile(db, { path: currentFile(), synced: mockFile(1, "remote") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);

  console.log("[test] behind (synced null, remote non-null) -> setS(different from remote) -> error");
  upsertFile(db, { path: newFile(), remote: mockFile(1, "remote") });
  assertThrows(() => upsertFile(db, { path: currentFile(), synced: mockFile(2, "other") }));

  console.log("[test] behind (synced non-null, remote null) -> setS(null) -> synced");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), synced: mockFile(2, null) });
  assertFileUntracked(db, currentFile());

  console.log("[test] behind (synced non-null, remote null) -> setS(non-null) -> error");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, null) });
  assertThrows(() => upsertFile(db, { path: currentFile(), synced: mockFile(2, "") }));

  console.log("[test] behind (synced non-null, remote non-null) -> setS(same as remote) -> synced");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "remote") });
  upsertFile(db, { path: currentFile(), synced: mockFile(2, "remote") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] behind (synced non-null, remote non-null) -> setS(different from remote) -> error");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "remote") });
  assertThrows(() => upsertFile(db, { path: currentFile(), synced: mockFile(2, "other") }));
}

export async function testFileV2StatusAhead() {
  const db = await createTestDb(SCHEMA);

  console.log("[test] ahead (synced null, local non-null) > setR(different from local) > conflict");
  upsertFile(db, { path: newFile(), local: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "remote") });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] ahead (synced null, local non-null) > setR(same as local) > behind");
  upsertFile(db, { path: newFile(), local: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileSourceless(db, currentFile());

  console.log("[test] ahead (synced null, local non-null) > setR(null) > conflict");
  upsertFile(db, { path: newFile(), local: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), remote: mockFile(2, null) });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] ahead (synced non-null, local null) > setR(same as synced) > conflict");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] ahead (synced non-null, local null) > setR(different from synced) > conflict");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, "remote") });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] ahead (synced non-null, local null) > setR(null) > behind");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, null) });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] ahead (synced non-null, local non-null) > setR(same as synced) > conflict");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "local") });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] ahead (synced non-null, local non-null) > setR(same as local) > behind");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "local") });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, "local") });
  assertFileStatus(db, currentFile(), DbFileStatus.Behind);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] ahead (synced non-null, local non-null) > setR(different) > conflict");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "local") });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, "remote") });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] ahead (synced non-null, local non-null) > setR(null) > conflict");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "local") });
  upsertFile(db, { path: currentFile(), remote: mockFile(3, null) });
  assertFileStatus(db, currentFile(), DbFileStatus.Conflict);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] ahead (synced null, local non-null) > setL(different from local) > ahead");
  upsertFile(db, { path: newFile(), local: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "local") });
  assertFileStatus(db, currentFile(), DbFileStatus.Ahead);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] ahead (synced null, local non-null) > setL(same as local) > ahead");
  upsertFile(db, { path: newFile(), local: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Ahead);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] ahead (synced null, local non-null) > setL(null) > untracked");
  upsertFile(db, { path: newFile(), local: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, null) });
  assertFileUntracked(db, currentFile());

  console.log("[test] ahead (synced non-null, local null) > setL(same as synced) > synced");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), local: mockFile(3, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] ahead (synced non-null, local null) > setL(different from synced) > ahead");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), local: mockFile(3, "local") });
  assertFileStatus(db, currentFile(), DbFileStatus.Ahead);
  assertFileUpdatedAt(db, currentFile(), 3);

  console.log("[test] ahead (synced non-null, local null) > setL(null) > ahead");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), local: mockFile(3, null) });
  assertFileStatus(db, currentFile(), DbFileStatus.Ahead);
  assertFileUpdatedAt(db, currentFile(), 3);

  console.log("[test] ahead (synced non-null, local non-null) > setL(same as synced) > synced");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "local") });
  upsertFile(db, { path: currentFile(), local: mockFile(3, "") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);
  assertFileUpdatedAt(db, currentFile(), 1);

  console.log("[test] ahead (synced non-null, local non-null) > setL(same as local) > ahead");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "local") });
  upsertFile(db, { path: currentFile(), local: mockFile(3, "local") });
  assertFileStatus(db, currentFile(), DbFileStatus.Ahead);
  assertFileUpdatedAt(db, currentFile(), 3);

  console.log("[test] ahead (synced non-null, local non-null) > setL(different) > ahead");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "local") });
  upsertFile(db, { path: currentFile(), local: mockFile(3, "remote") });
  assertFileStatus(db, currentFile(), DbFileStatus.Ahead);
  assertFileUpdatedAt(db, currentFile(), 3);

  console.log("[test] ahead (synced non-null, local non-null) > setL(null) > ahead");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "local") });
  upsertFile(db, { path: currentFile(), local: mockFile(3, null) });
  assertFileStatus(db, currentFile(), DbFileStatus.Ahead);
  assertFileUpdatedAt(db, currentFile(), 3);

  console.log("[test] ahead (synced null, local non-null) -> setS(same as local) -> synced");
  upsertFile(db, { path: newFile(), local: mockFile(1, "local") });
  upsertFile(db, { path: currentFile(), synced: mockFile(1, "local") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);

  console.log("[test] ahead (synced null, local non-null) -> setS(different from local) -> error");
  upsertFile(db, { path: newFile(), local: mockFile(1, "local") });
  assertThrows(() => upsertFile(db, { path: currentFile(), synced: mockFile(2, "other") }));

  console.log("[test] ahead (synced non-null, local null) -> setS(null) -> synced");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, null) });
  upsertFile(db, { path: currentFile(), synced: mockFile(2, null) });
  assertFileUntracked(db, currentFile());

  console.log("[test] ahead (synced non-null, local null) -> setS(non-null) -> error");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, null) });
  assertThrows(() => upsertFile(db, { path: currentFile(), synced: mockFile(2, "") }));

  console.log("[test] ahead (synced non-null, local non-null) -> setS(same as local) -> synced");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "local") });
  upsertFile(db, { path: currentFile(), synced: mockFile(2, "local") });
  assertFileStatus(db, currentFile(), DbFileStatus.Synced);
  assertFileUpdatedAt(db, currentFile(), 2);

  console.log("[test] ahead (synced non-null, local non-null) -> setS(different from local) -> error");
  upsertFile(db, { path: newFile(), synced: mockFile(1, "") });
  upsertFile(db, { path: currentFile(), local: mockFile(2, "local") });
  assertThrows(() => upsertFile(db, { path: currentFile(), synced: mockFile(2, "other") }));
}

export async function testFileV2StatusConflict() {
  const db = await createTestDb(SCHEMA);
}

// TODO test timestamp order view
// TODO test meta view
// TODO test content view

export interface UpsertManyInput<T extends {}> {
  table: string;
  key: string & keyof T;
  rows: T[];
}

/**
 * Upsert multiple rows of different kind
 */
export function upsertMany<T extends {}>(db: Sqlite3.DB, input: UpsertManyInput<T>) {
  return input.rows.map((row) => {
    return upsertOne(db, { table: input.table, key: input.key, row });
  });
}

/**
 * Upsert multiple rows of the same kind
 */
export function usertBulk<T extends {}>(db: Sqlite3.DB, input: UpsertManyInput<T>) {
  return upsertInternal(db, input);
}

export interface UpsertOneInput<T extends {}> {
  table: string;
  key: string & keyof T;
  row: T;
}

export function upsertOne<T extends {}>(db: Sqlite3.DB, input: UpsertOneInput<T>) {
  return upsertInternal(db, { table: input.table, key: input.key, rows: [input.row] });
}

function upsertInternal<T extends {}>(db: Sqlite3.DB, input: UpsertManyInput<T>) {
  if (!input.rows.length) return;

  const refRow = input.rows[0];
  const cols = Object.keys(refRow);
  const nonKeyCols = cols.filter((col) => col !== input.key);

  const sql = [
    `INSERT INTO ${input.table} (${cols.join(",")}) VALUES`,
    input.rows.map((_, i) => `(${cols.map((col) => `:${col}${i}`).join(",")})`).join(","),
    nonKeyCols.length
      ? `ON CONFLICT(${input.key}) DO UPDATE SET ${cols
          .filter((col) => col !== input.key)
          .map((col) => `${col} = excluded.${col}`)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  // TODO minimize col names to index
  const bind = paramsToBindings(sql, arrayToParams(input.rows));
  return db.exec(sql, { bind });
}

export interface SelectManyInput<T extends {}> {
  table: string;
  key: string & keyof T;
  value: any[];
}
export function selectMany<T extends {}>(db: Sqlite3.DB, input: SelectManyInput<T>): (T | undefined)[] {
  return input.value.map((value) => {
    return selectOne(db, { table: input.table, key: input.key, value });
  });
}

export interface SelectOneInput<T extends {}> {
  table: string;
  key: string & keyof T;
  value: any;
}

export function selectOne<T extends {}>(db: Sqlite3.DB, input: SelectOneInput<T>): T | undefined {
  const sql = `SELECT * FROM ${input.table} WHERE ${input.key} = :${input.key}`;
  const bind = paramsToBindings(sql, { [input.key]: input.value });
  const file = db.selectObject<T>(sql, bind);
  return file;
}
