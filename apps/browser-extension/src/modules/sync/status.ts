export function formatStatus(dirtyFile: any[]) {
  if (!dirtyFile.length) return "Up to date";
  return `↑ ${dirtyFile.length}`;
}
