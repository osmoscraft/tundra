import { destoryOpfsByPath, loadApiIndex, openOpfsDb } from "@tinykb/sqlite-utils";

export const initFileSystemDb = (dbPath: string) =>
  loadApiIndex("./sqlite3/jswasm/").then(openOpfsDb.bind(null, dbPath));

export const destoryFileSystemDb = (dbPath: string) => destoryOpfsByPath(dbPath);
