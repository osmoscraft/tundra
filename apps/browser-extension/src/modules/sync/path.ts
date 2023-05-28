// Path conventions:
// - local path: notes/<timestamp>.md
// - zip path: <repo>-<hash>/notes/<timestamp>.md
// - tarball path can be one of the following, due to truncation
//   - <repo>-<hash>/notes/<timestamp>.md
//   - notes/<timestamp>.md
//   - <timestamp>.md

/**
 * Caveat: unlike zip path, tarball path only works with the given prefix
 */
export function tarballToNoteFilePath(tarballPath: string) {
  const filename = tarballPath.match(/^(.+\/)?(.+\.md)/)?.[2];
  return filename ? `notes/${filename}` : undefined;
}

export function zipPathToGitHubFilePath(zipPath: string) {
  return zipPath.slice(zipPath.indexOf("/") + 1);
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
