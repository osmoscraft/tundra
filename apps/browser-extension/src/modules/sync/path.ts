import { compose } from "@tinykb/fp-utils";

export function zipPathToGitHubFilePath(zipPath: string) {
  return zipPath.slice(zipPath.indexOf("/") + 1);
}

export function githubPathToLocalPath(githubPath: string) {
  return githubPath.match(/^(notes\/.*\.md)/)?.[1];
}

export const zipPathToLocalFilePath = compose(githubPathToLocalPath, zipPathToGitHubFilePath);
