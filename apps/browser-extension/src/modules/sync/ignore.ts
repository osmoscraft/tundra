import { getFile } from "../database";
import type { IgnoreNeta } from "../database/meta";

export function getIgnorePatterns(db: Sqlite3.DB) {
  const systemIgnoreList = getSystemIgnore();
  const userIgnoreList = (getFile(db, ".gitignore")?.meta as IgnoreNeta | undefined)?.match ?? [];
  const uniqueIgnoreList = [...new Set([...systemIgnoreList, ...userIgnoreList])];
  return uniqueIgnoreList.map((pattern) => `${pattern}*`);
}

export function getSystemIgnore() {
  return ["config/sync"];
}
