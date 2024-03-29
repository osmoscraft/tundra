// GitHub Archive path conventions:
// <repo>-<hash>/<filepath>
export function archivePathToGithubFilePath(archivePath: string) {
  return archivePath.slice(archivePath.indexOf("/") + 1);
}

export function timestampToId(timestamp: Date) {
  return timestamp
    .toISOString()
    .split(".")[0]
    .replaceAll(/(-|:|T)/g, "");
}

export function noteIdToPath(id: string) {
  return `data/notes/${id}.md`;
}

export function notePathToId(path: string) {
  return path.match(/data\/notes\/(.*)\.md/)![1];
}

export function addIdByPath<T extends { path: string }>(withPath: T) {
  return { ...withPath, id: notePathToId(withPath.path) };
}
