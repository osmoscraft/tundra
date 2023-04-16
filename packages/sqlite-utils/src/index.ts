/// <reference path="./typings.d.ts" />

/**
 * Load SQLite API index
 *
 * The lib dir must contain all of the following
 * - `sqlite3-bundler-friendly.mjs`
 * - `sqlite3-opfs-async-proxy.js`
 * - `sqlite3-wasm`
 *
 * The dir must end with `/`
 */
export function loadApiIndex(publicDir: string) {
  return import(publicDir + "sqlite3-bundler-friendly.mjs").then((result) =>
    result.default()
  ) as Promise<Sqlite3.ApiIndex>;
}

export function getLibversion(sqlite3: Sqlite3.ApiIndex) {
  return sqlite3.capi.sqlite3_libversion();
}

/**
 * Open SQLite with Opfs as storage backend
 *
 * The path must starts with "/" and point to a filename that will be used by the Opfs
 */
export function openOpfsDb(path: string, sqlite3: Sqlite3.ApiIndex) {
  assertOpfs(sqlite3);
  return new sqlite3.oo1.OpfsDb(path);
}

function assertOpfs(sqlite3: Sqlite3.ApiIndex) {
  if (!sqlite3.opfs) throw new Error("OPFS is not loaded");
  return sqlite3;
}

export interface InitResult {
  db: Sqlite3.DB;
  libVersion: string;
  duration: number;
}

export function logInitResult(opfsPath: string, result: InitResult) {
  console.log(`[sqlite] ${opfsPath} | ${result.libVersion} | ${result.duration.toFixed(2)} ms`);
}

export function initWithSchema(opfsPath: string, schema: string): Promise<InitResult> {
  return Promise.resolve(performance.mark(`init/${opfsPath}`))
    .then(() => loadApiIndex("./sqlite3/jswasm/"))
    .then((api) => ({
      db: execSchema(schema, openOpfsDb(opfsPath, api)),
      libVersion: getLibversion(api),
      duration: performance.measure(`init/${opfsPath}`, `init/${opfsPath}`).duration,
    }));
}

function execSchema(schema: string, db: Sqlite3.DB) {
  db.exec(schema);
  return db;
}

export function destoryOpfsByPath(path: string) {
  return destoryRootLevelOpfs(opfsPathToRootFilename(path));
}

export function getOpfsFileByPath(path: string) {
  return getRootLevelOpfsFile(opfsPathToRootFilename(path));
}

async function destoryRootLevelOpfs(filename: string) {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry(filename);
}

async function getRootLevelOpfsFile(filename: string) {
  const root = await navigator.storage.getDirectory();
  const dbFileHandle = await root.getFileHandle(filename);
  const file = await dbFileHandle.getFile();
  return file;
}

function opfsPathToRootFilename(opfsPath: string) {
  const [empty, filename, ...emptyList] = opfsPath.split("/");
  if (empty || emptyList.length) {
    throw new Error(`Invalid opfsPath "${opfsPath}". It must be in the format "/filename"`);
  }

  return filename;
}
