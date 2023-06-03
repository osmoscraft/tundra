import type { DbFile } from "../database/schema";

export function formatStatus(dirtyFile: DbFile[]) {
  if (!dirtyFile.length) return "Up to date";
  return `↑ ${dirtyFile.length}`;
}
