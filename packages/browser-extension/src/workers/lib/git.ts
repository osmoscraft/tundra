import type { PromiseFsClient } from "../vendor/isomorphic-git/index.umd.min";
import Git from "../vendor/isomorphic-git/index.umd.min";
export interface EnsureRepoProps {
  git: typeof Git;
  fs: PromiseFsClient;
  dir: string;
  author: GitAuthor;
}
export async function ensureRepo({ git, fs, dir, author }: EnsureRepoProps) {
  try {
    await git.findRoot({
      fs,
      filepath: dir,
    });
  } catch (error) {
    if (error instanceof Git.Errors.NotFoundError) {
      await git.init({
        fs,
        dir,
      });
      await git.setConfig({ fs, dir, path: "user.name", value: "tinykb" });
      await git.commit({ fs, dir, message: "Initial commit", author });
    }
  }
}

export interface GitAuthor {
  name: string;
  email?: string;
}
