import type { ChangedFile } from ".";

export function formatStatus(changedFiles: ChangedFile[]) {
  if (!changedFiles.length) return "Up to date";
  const localChangeCount = changedFiles.filter((file) => file.source === "local").length;
  const remoteChangeCount = changedFiles.filter((file) => file.source === "remote").length;
  const sharedCount = changedFiles.filter((file) => file.source === "both").length;

  return `↑ ${localChangeCount + sharedCount} | ↓ ${remoteChangeCount + sharedCount}`;
}