import { getDirtyFiles, getFile } from "../database";
import type { IgnoreNeta } from "../meta/meta-parser";

export function scanLocalChangedFiles(db: Sqlite3.DB) {
  const ignoreList = (getFile(db, ".gitignore")?.meta as IgnoreNeta | undefined)?.match ?? [];
  const globPatterns = ignoreList.map((pattern) => `${pattern}*`);
  return getDirtyFiles(db, globPatterns);
}
