import { sqlite3Mem } from "@tinykb/sqlite-utils";
import { assertEqual } from "../../live-test";
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

export interface Fsm {
  /**
   * Test FSM transitions
   *
   * Spec format: `fromFileSpec | actionSpec | toFileSpec`
   *
   * File or action spec foramt: `<localState> <remoteState> <syncedState>`
   *
   * State format:
   * - `<0-9><A-Za-z>`: e.g. `1a` means content = a, updatedAt = 1
   * - `<A-Za-z>.`: e.g. `1.` emans content = null, updatedAt = 1
   * - `..`: no-op in actionSpec, non-exist state otherwise
   *
   * Special Spec string
   * - `.. .. ..`: skip action in actionSpec, untracked item otherwise
   * - `!! !! !!`: error (toSpec only)
   */
  (db: Sqlite3.DB, spec: string): void;
  /** Same as fsm() but print verbose log */
  verbose(db: Sqlite3.DB, spec: string): void;
  /** Same as fsm.verbose() but pause at breakpoint before test */
  debug(db: Sqlite3.DB, spec: string): void;
}

export const fsm: Fsm = ((db: Sqlite3.DB, spec: string) => fsmSpec(db, spec)) as Fsm;
Object.assign(fsm, {
  verbose(db: Sqlite3.DB, spec: string) {
    fsmSpec(db, spec, { verbose: true });
  },
  debug(db: Sqlite3.DB, spec: string) {
    fsmSpec(db, spec, { verbose: true, debugger: true });
  },
});

function fsmSpec(db: Sqlite3.DB, spec: string, options?: FsmOptions) {
  try {
    assertFSM(db, spec, {
      debugger: options?.debugger ?? false,
      verbose: options?.verbose ?? false,
    });
    console.log("✅", spec);
  } catch (e) {
    console.log("❌", spec);
    throw e;
  }
}

interface FsmOptions {
  debugger?: boolean;
  verbose?: boolean;
}

function assertFSM(db: Sqlite3.DB, spec: string, options: FsmOptions) {
  if (options.debugger) debugger;

  const [from, action, to] = spec.split(" | ");
  const parsedFrom = parseState(from);
  if (parsedFrom?.type === "ERROR") throw Error(`from (${from}) cannot be of type ${parsedFrom?.type ?? null}`);
  const parsedAction = parseState(action);
  if (parsedAction?.type === "ERROR") throw Error(`action (${action}) cannot be of type ${parsedAction?.type ?? null}`);
  const parsedTo = parseState(to);

  const filename = newFile();

  // setup from state
  const arrange = () => {
    if (parsedFrom === null) {
      if (options.verbose) console.log("[fsm] from skipped");
      return;
    }

    const fromState: TestDbWritable = {
      path: filename,
      ...(parsedFrom.local ? { local: mockFile(parsedFrom.local.updatedAt, parsedFrom.local.content) } : undefined),
      ...(parsedFrom.remote ? { remote: mockFile(parsedFrom.remote.updatedAt, parsedFrom.remote.content) } : undefined),
      ...(parsedFrom.synced ? { synced: mockFile(parsedFrom.synced.updatedAt, parsedFrom.synced.content) } : undefined),
    };

    if (options.verbose) console.log("[fsm] from", fromState);
    upsertFile(db, fromState);
  };

  const act = () => {
    if (parsedAction === null) {
      if (options.verbose) console.log("[fsm] action skipped");
      return;
    }

    const actionState: TestDbWritable = {
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
    };

    if (options.verbose) console.log("[fsm] action", actionState);

    upsertFile(db, actionState);
  };

  const assert = (act: () => any) => {
    let actualTo: string;
    try {
      act();
      const resultFile = selectFile(db, filename);
      if (options.verbose) console.log("[fsm] action result ", resultFile);
      actualTo = encodeFile(resultFile);
      if (options.verbose) console.log("[fsm] action result encoded", actualTo);
    } catch (e) {
      if (options.verbose) console.log("[fsm] action error", e);
      actualTo = "!! !! !!";
    }

    assertEqual(actualTo, to);
  };

  function encodeFile(file?: DbFileV2Internal) {
    if (!file) return ".. .. ..";
    return `${encodeFileStateItem(file.local)} ${encodeFileStateItem(file.remote)} ${encodeFileStateItem(file.synced)}`;
  }

  function encodeFileStateItem(fileStateString: DbFileV2Internal["local" | "remote" | "synced" | "source"]) {
    if (!fileStateString) return "..";

    const fileStateItem = JSON.parse(fileStateString!) as DbFileV2Snapshot;
    return `${fileStateItem.updatedAt}${fileStateItem.content}`;
  }

  arrange();
  assert(() => {
    act();
  });
}

interface ParsedState {
  type: "STATE" | "ERROR";
  local: ParsedStateItem | null;
  remote: ParsedStateItem | null;
  synced: ParsedStateItem | null;
}

interface ParsedStateItem {
  type: "STATE";
  content: string | null;
  updatedAt: number;
}

function parseState(state: string): ParsedState | null {
  if (state === ".. .. ..") return null;
  if (state === "!! !! !!") return specialState("ERROR");

  function specialState(stateType: ParsedState["type"]): ParsedState {
    return {
      type: stateType,
      local: null,
      remote: null,
      synced: null,
    };
  }

  const [local, remote, synced] = state.split(" ").map((s) => {
    if (s === "..") return null;
    const contentTimeMatch = s.match(/(\d+)(.+)/);
    if (!contentTimeMatch) throw Error(`invalid state string ${state}`);
    const [, time, content] = contentTimeMatch;
    return {
      type: "STATE",
      content: content === "." ? null : content,
      updatedAt: parseInt(time),
    } as ParsedStateItem;
  });

  return {
    type: "STATE",
    local,
    remote,
    synced,
  };
}
