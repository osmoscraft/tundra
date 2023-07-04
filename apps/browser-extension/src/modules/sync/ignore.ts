import { getFile } from "../database";
import type { IgnoreNeta } from "../database/meta";

export function getUserIgnores(db: Sqlite3.DB) {
  const ignoreList = (getFile(db, ".gitignore")?.meta as IgnoreNeta | undefined)?.match ?? [];
  return ignoreList.map((pattern) => `${pattern}*`);
}