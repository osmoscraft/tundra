import { sqlite3Mem } from "@tinykb/sqlite-utils";
import { assertEqual } from "../../live-test";
import { selectFile, upsertFile } from "../file";
import type { DbFileV2ParsedSource, DbFileV2Status, DbInternalFileV2, DbWritableFileV2 } from "../schema";
import type { ColumnSpec } from "./spec-gen";

let db: Sqlite3.DB | undefined;
export async function createTestDb(schema: string) {
  db ??= await createEmptyDb();
  db.exec(`
  DROP TABLE IF EXISTS File;
  DROP INDEX IF EXISTS UpdatedAtIdx;
  DROP INDEX IF EXISTS StatusIdx;
  DROP INDEX IF EXISTS LocalActionIdx;
  DROP INDEX IF EXISTS RemoteActionIdx;
  DROP TABLE IF EXISTS FileFts;
  `);
  db.exec(schema);

  return db;
}

export async function createEmptyDb() {
  const db = await sqlite3Mem("./sqlite3/jswasm/");
  return db;
}

// test utils
export function mockFile(time: number, content: string | null, meta: string | null = null) {
  const snapshot: DbFileV2ParsedSource = { updatedAt: time, content, meta };
  return JSON.stringify(snapshot);
}

const selectTestFile = selectFile as (db: Sqlite3.DB, path: string) => DbInternalFileV2 | undefined;

export function assertFileUpdatedAt(db: Sqlite3.DB, path: string, version: number) {
  const source = selectTestFile(db, path)?.source;
  if (!source) throw new Error(`File version assertion error: ${path} has no source`);
  assertEqual((JSON.parse(source) as DbFileV2ParsedSource).updatedAt, version);
}

export function assertFileSourceless(db: Sqlite3.DB, path: string) {
  assertEqual(selectTestFile(db, path)!.source, null);
}

export function assertFileUntracked(db: Sqlite3.DB, path: string) {
  assertEqual(selectTestFile(db, path), undefined);
}

export function assertFileStatus(db: Sqlite3.DB, path: string, status: DbFileV2Status) {
  assertEqual(selectTestFile(db, path)?.status, status);
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

export const assertFsm: Fsm = ((db: Sqlite3.DB, spec: string) => fsmSpec(db, spec)) as Fsm;
Object.assign(assertFsm, {
  verbose(db: Sqlite3.DB, spec: string) {
    fsmSpec(db, spec, { verbose: true });
  },
  debug(db: Sqlite3.DB, spec: string) {
    fsmSpec(db, spec, { verbose: true, debugger: true });
  },
});

function fsmSpec(db: Sqlite3.DB, spec: string, options?: FsmOptions) {
  if (options?.verbose) console.log("\n▶️", spec);
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

  const filename = newFile();

  // setup from state
  const arrange = () => {
    if (parsedFrom === null) {
      if (options.verbose) console.log("[fsm] from skipped");
      return;
    }

    const fromState: DbWritableFileV2 = {
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

    const actionState: DbWritableFileV2 = {
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
      const resultFile = selectTestFile(db, filename);
      if (options.verbose) console.log("[fsm] action result ", resultFile);
      actualTo = encodeFile(resultFile);
      if (options.verbose) console.log("[fsm] action result encoded", actualTo);
    } catch (e) {
      if (options.verbose) console.log("[fsm] action error", e);
      actualTo = "!! !! !!";
    }

    assertEqual(actualTo, to, `expected ${to}, got ${actualTo}`);
  };

  function encodeFile(file?: DbInternalFileV2) {
    if (!file) return ".. .. ..";
    const encoding = `${encodeFileStateItem(file.local)} ${encodeFileStateItem(file.remote)} ${encodeFileStateItem(
      file.synced
    )}`;
    if (file && encoding === ".. .. ..") return "!! !! !!";
    return encoding;
  }

  function encodeFileStateItem(fileStateString: DbInternalFileV2["local" | "remote" | "synced" | "source"]) {
    if (!fileStateString) return "..";

    const fileStateItem = JSON.parse(fileStateString!) as DbFileV2ParsedSource;
    return `${fileStateItem.updatedAt}${fileStateItem.content ?? "."}`;
  }

  assert(() => {
    arrange();
    act();
  });
}

export function encodeParsedState(parsedState: ParsedState | null) {
  if (parsedState === null) return ".. .. ..";

  return `${encodeParsedStateItem(parsedState.local)} ${encodeParsedStateItem(
    parsedState.remote
  )} ${encodeParsedStateItem(parsedState.synced)}`;
}

function encodeParsedStateItem(parsedStateItem: ParsedStateItem | null) {
  if (parsedStateItem === null) return "..";

  return `${parsedStateItem.updatedAt}${parsedStateItem.content ?? "."}`;
}

export interface ParsedState {
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

export function parseState(state: string): ParsedState | null {
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

interface ColumnSpecOptions {
  debugger?: boolean;
  verbose?: boolean;
}

export interface AssertColumnSpec {
  /**
   * Test Derived Columns
   */
  (db: Sqlite3.DB, spec: ColumnSpec, options?: ColumnSpecOptions): void;
  /** Same as fsm() but print verbose log */
  verbose(db: Sqlite3.DB, spec: string): void;
  /** Same as fsm.verbose() but pause at breakpoint before test */
  debug(db: Sqlite3.DB, spec: string): void;
}

export const assertColumnSpec: AssertColumnSpec = ((
  db: Sqlite3.DB,
  columnSpec: ColumnSpec,
  options: ColumnSpecOptions
) => {
  if (options?.debugger) debugger;

  const parsedFrom = parseState(columnSpec.input);
  if (parsedFrom === null) throw new Error("column spec test does not support null input");

  const filename = newFile();

  const act = () => {
    const fromState: DbWritableFileV2 = {
      path: filename,
      ...(parsedFrom.local ? { local: mockFile(parsedFrom.local.updatedAt, parsedFrom.local.content) } : undefined),
      ...(parsedFrom.remote ? { remote: mockFile(parsedFrom.remote.updatedAt, parsedFrom.remote.content) } : undefined),
      ...(parsedFrom.synced ? { synced: mockFile(parsedFrom.synced.updatedAt, parsedFrom.synced.content) } : undefined),
    };

    if (options?.verbose) console.log("[column specs] from", fromState);
    upsertFile(db, fromState);
  };

  const assert = () => {
    const resultFile = selectTestFile(db, filename);
    if (options?.verbose) console.log("[column specs] action result ", resultFile);
    columnSpec.cols.forEach((col) => {
      const actualValue = (resultFile as any)[col.key];
      if (actualValue !== col.value)
        throw new Error(
          `❌ "${columnSpec.input}" is expected to have ${col.key}=${col.value} but got ${col.key}=${actualValue}`
        );
    });
  };

  try {
    act();
    console.log("✅", `${columnSpec.input} | ${columnSpec.cols.map((c) => `${c.key}=${c.value}`).join(" | ")}`);
  } catch (e) {
    console.log(`❌ "${columnSpec.input}" caused action error`, e);
    throw e;
  }

  assert();
}) as AssertColumnSpec;

Object.assign(assertColumnSpec, {
  verbose: (db: Sqlite3.DB, spec: ColumnSpec) => assertColumnSpec(db, spec, { verbose: true }),
  debug: (db: Sqlite3.DB, spec: ColumnSpec) => assertColumnSpec(db, spec, { debugger: true }),
});
