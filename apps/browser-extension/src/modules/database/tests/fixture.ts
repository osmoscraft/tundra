import { sqlite3Mem } from "@tinykb/sqlite-utils";
import { assertDefined, assertEqual, assertThrows } from "../../live-test";
import type { DbFileStatus, DbFileV2Internal, DbFileV2Snapshot } from "../schema";
import { selectMany, upsertMany } from "./file-v2.test";

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

type TestDbWritable = Partial<DbFileV2Internal> & { path: string };

// test utils
export function mockFile(time: number, content: string | null, meta: string | null = null) {
  const snapshot: DbFileV2Snapshot = { updatedAt: time, content, meta };
  return JSON.stringify(snapshot);
}

export function upsertFiles(db: Sqlite3.DB, files: TestDbWritable[]) {
  return upsertMany<TestDbWritable>(db, { table: "FileV2", key: "path", rows: files });
}
export function upsertFile(db: Sqlite3.DB, file: TestDbWritable) {
  return upsertFiles(db, [file]);
}

export function selectFiles(db: Sqlite3.DB, paths: string[]) {
  return selectMany<DbFileV2Internal>(db, { table: "FileV2", key: "path", value: paths });
}

export function selectFile(db: Sqlite3.DB, path: string) {
  return selectFiles(db, [path])[0];
}

export function assertFileUpdatedAt(db: Sqlite3.DB, path: string, version: number) {
  const source = selectFile(db, path)?.source;
  if (!source) throw new Error(`File version assertion error: ${path} has no source`);
  assertEqual((JSON.parse(source) as DbFileV2Snapshot).updatedAt, version);
}

export function assertFileSourceless(db: Sqlite3.DB, path: string) {
  assertEqual(selectFile(db, path)!.source, null);
}

export function assertFileUntracked(db: Sqlite3.DB, path: string) {
  assertEqual(selectFile(db, path), undefined);
}

export function assertFileStatus(db: Sqlite3.DB, path: string, status: DbFileStatus) {
  assertEqual(selectFile(db, path)?.status, status);
}

const fileNames = new (class {
  private currentIndex = 0;
  next() {
    this.currentIndex++;
    return this.current();
  }
  current() {
    return `file${this.currentIndex}`;
  }
})();
export function newFile() {
  return fileNames.next();
}
export function currentFile() {
  return fileNames.current();
}

/**
 * Test FSM transitions
 *
 * Spec format: `fromFileSpec > actionSpec > toFileSpec`
 *
 * File or action spec foramt: `<localState> <remoteState> <syncedState>`
 *
 * State format: `<A-Za-z><0-9> | <A-Za-z>- | -- | ..`
 * - `a1`: content = a, updatedAt = 1
 * - `-1`: content = null, updatedAt = 1
 * - `--`: non-exist state
 * - `..`: no-op (actionSpec only)
 *
 * Special Spec string
 * - `-- -- --`: untracked item (fromFileSpec and toFileSpec only)
 * - `!! !! !!`: error (toSpec only)
 * - `.. .. ..`: skip entire action (actionSpec only)
 */
export function fsmSpec(db: Sqlite3.DB, spec: string) {
  try {
    assertFSM(db, spec);
    console.log("✅", spec);
  } catch (e) {
    console.log("❌", spec);
    throw e;
  }
}

export function assertFSM(db: Sqlite3.DB, spec: string) {
  const [from, action, to] = spec.split(" > ");
  const parsedFrom = parseState(from);
  if (parsedFrom === null || parsedFrom.type === "ERROR" || parsedFrom.type === "NOOP")
    throw Error(`from (${from}) cannot be of type ${parsedFrom?.type ?? null}`);
  const parsedAction = parseState(action);
  if (parsedAction === null || parsedAction.type === "ERROR")
    throw Error(`action (${action}) cannot be of type ${parsedAction?.type ?? null}`);
  const parsedTo = parseState(to);
  if (parsedTo?.type === "NOOP") throw Error(`to (${to}) cannot be of type ${parsedTo.type}`);

  const filename = newFile();

  // setup from state
  const setupFrom = () => {
    if (parsedFrom === null) return;

    upsertFile(db, {
      path: filename,
      ...(parsedFrom.local ? { local: mockFile(parsedFrom.local.updatedAt, parsedFrom.local.content) } : undefined),
      ...(parsedFrom.remote ? { remote: mockFile(parsedFrom.remote.updatedAt, parsedFrom.remote.content) } : undefined),
      ...(parsedFrom.synced ? { synced: mockFile(parsedFrom.synced.updatedAt, parsedFrom.synced.content) } : undefined),
    });
  };

  const setupAction = () => {
    if (parsedAction.type !== "NOOP") return;

    upsertFile(db, {
      path: filename,
      ...(parsedAction.local
        ? { local: mockFile(parsedAction.local.updatedAt, parsedAction.local.content) }
        : undefined),
      ...(parsedAction.remote
        ? { remote: mockFile(parsedAction.remote.updatedAt, parsedAction.remote.content) }
        : undefined),
      ...(parsedAction.synced
        ? { synced: mockFile(parsedAction.synced.updatedAt, parsedAction.synced.content) }
        : undefined),
    });
  };

  const assertResults = (task: () => any) => {
    if (parsedTo === null) {
      task();
      assertFileUntracked(db, filename);
      return;
    }

    if (parsedTo.type === "ERROR") {
      assertThrows(task);
      return;
    }

    if (parsedTo.type === "STATE") {
      task();
      const resultFile = selectFile(db, filename);
      if (!resultFile) throw Error(`file does not exist after test`);

      assertStateItem(parsedTo.local, resultFile.local);
      assertStateItem(parsedTo.remote, resultFile.remote);
      assertStateItem(parsedTo.synced, resultFile.synced);
      return;
    }
  };

  function assertStateItem(
    stateItem: ParsedStateItem | null,
    fileStateString: DbFileV2Internal["local" | "remote" | "synced" | "source"]
  ) {
    if (stateItem === null) {
      assertEqual(fileStateString, null);
      return;
    } else {
      assertDefined(fileStateString);
    }

    if (stateItem.type === "NOOP") throw new Error("NOOP state item not supported");

    const fileStateItem = JSON.parse(fileStateString!) as DbFileV2Snapshot;
    assertEqual(stateItem.updatedAt, fileStateItem.updatedAt);
    assertEqual(stateItem.content, fileStateItem.content);
  }

  assertResults(() => {
    setupFrom();
    setupAction();
  });
}

interface ParsedState {
  type: "STATE" | "ERROR" | "NOOP";
  local: ParsedStateItem | null;
  remote: ParsedStateItem | null;
  synced: ParsedStateItem | null;
}

interface ParsedStateItem {
  type: "NOOP" | "STATE";
  content: string | null;
  updatedAt: number;
}

function parseState(state: string): ParsedState | null {
  if (state === "-- -- --") return null;
  if (state === "!! !! !!") return specialState("ERROR");
  if (state === ".. .. ..") return specialState("NOOP");

  function specialState(stateType: ParsedState["type"]): ParsedState {
    return {
      type: stateType,
      local: null,
      remote: null,
      synced: null,
    };
  }

  const [local, remote, synced] = state.split(" ").map((s) => {
    const contentTimeMatch = s.match(/(.+?)(\d+)/);
    if (!contentTimeMatch) throw Error(`invalid state string ${state}`);
    const [, content, time] = contentTimeMatch;
    const pattern = content + time;
    switch (pattern) {
      case "..":
        return {
          type: "NOOP",
          content: null,
          updatedAt: 0,
        } as ParsedStateItem;
      case "--":
        return null;
      default: {
        return {
          type: "STATE",
          content: content === "-" ? null : content,
          updatedAt: parseInt(time),
        } as ParsedStateItem;
      }
    }
  });

  return {
    type: "STATE",
    local,
    remote,
    synced,
  };
}
