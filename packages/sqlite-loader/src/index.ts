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
