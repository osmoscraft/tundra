import type { DbFileReadable } from "../database/schema";

export function formatStatus(dirtyFile: DbFileReadable[]) {
  if (!dirtyFile.length) return "Up to date";
  return `↑ ${dirtyFile.length}`;
}
