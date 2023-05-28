export function tarballPathGitHubPath(tarballPath: string) {
  return tarballPath.slice(tarballPath.indexOf("/") + 1);
}

export function zipPathToGitHubFilePath(zipPath: string) {
  return zipPath.slice(zipPath.indexOf("/") + 1);
}

export function githubPathToLocalPath(githubPath: string) {
  return githubPath.match(/^(notes\/.*\.md)/)?.[1];
}

export function timestampToLocalPath(timestamp: Date) {
  const timestampString = timestamp
    .toISOString()
    .split(".")[0]
    .replaceAll(/(-|:|T)/g, "");
  return `notes/${timestampString}.md`;
}
