// GitHub Archive path conventions:
// <repo>-<hash>/<filepath>
export function archivePathToGitHubFilePath(archivePath: string) {
  return archivePath.slice(archivePath.indexOf("/") + 1);
}

export function githubPathToNotePath(githubPath: string) {
  return githubPath.match(/^(notes\/.*\.md)/)?.[1];
}

export function timestampToNotePath(timestamp: Date) {
  const timestampString = timestamp
    .toISOString()
    .split(".")[0]
    .replaceAll(/(-|:|T)/g, "");
  return `notes/${timestampString}.md`;
}
