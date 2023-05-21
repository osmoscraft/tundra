import { DbFileChangeSource, type DbFileChange } from ".";

export function formatStatus(changedFiles: DbFileChange[]) {
  if (!changedFiles.length) return "Up to date";
  const localChangeCount = changedFiles.filter((file) => file.source === DbFileChangeSource.Local).length;
  const remoteChangeCount = changedFiles.filter((file) => file.source === DbFileChangeSource.Remote).length;
  const sharedCount = changedFiles.filter((file) => file.source === DbFileChangeSource.Both).length;

  return `↑ ${localChangeCount + sharedCount} | ↓ ${remoteChangeCount + sharedCount}`;
}
