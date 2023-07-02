/// <reference path="./typings.d.ts" />

export function sqlite3Mem(sqlite3WasmPath: string) {
  return loadApiIndex(sqlite3WasmPath).then((api) => new api.oo1.DB(":memory:"));
}

export function sqlite3Opfs(sqliteWasmPath: string, dbPath: string) {
  return loadApiIndex(sqliteWasmPath).then(openOpfsDb.bind(null, dbPath));
}

/**
 * Load SQLite API index
 *
 * The lib dir must contain all of the following
 * - `sqlite3.mjs` (for browser)
 * - `sqlite3-node.mjs` (for node)
 * - `sqlite3-opfs-async-proxy.js`
 * - `sqlite3-wasm`
 *
 * The dir must end with `/`
 */
export function loadApiIndex(publicDir: string) {
  const runtimeBinary = isNodeRuntime() ? "sqlite3-node.mjs" : "sqlite3.mjs";
  return import(pathJoin(publicDir, runtimeBinary)).then((result) => result.default()) as Promise<Sqlite3.ApiIndex>;
}

function pathJoin(...paths: string[]) {
  return paths.join("/").replace(/\/+/g, "/");
}

function isNodeRuntime() {
  return typeof (globalThis as any).process !== "undefined";
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
      db: openOpfsDb(opfsPath, api).exec(schema),
      libVersion: getLibversion(api),
      duration: performance.measure(`init/${opfsPath}`, `init/${opfsPath}`).duration,
    }));
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

export function paramsToBindings(sql: string, params: any) {
  const bindKeys = sql.matchAll(/:([a-zA-Z0-9]+)/g);
  const bindObject = Object.fromEntries(
    [...bindKeys].map(([key, variableName]) => [key, getOrThrow(params, variableName)])
  );

  return bindObject as Sqlite3.Bind;
}

function getOrThrow(object: any, key: string) {
  if (object.hasOwnProperty(key)) {
    return object[key];
  } else {
    console.error(`Variable ":${key}" has no matching key "${key}" in object`, object);
    throw new Error(`Binding key not found`);
  }
}

export function arrayToParams(objects: any[]) {
  return Object.fromEntries(
    objects.flatMap((object, i) => Object.entries(object).map(([key, value]) => [`${key}${i}`, value]))
  );
}
