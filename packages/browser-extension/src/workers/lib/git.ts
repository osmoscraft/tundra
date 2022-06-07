import type Git from "../vendor/isomorphic-git/index.umd.min";
import type { PromiseFsClient } from "../vendor/isomorphic-git/index.umd.min";
export interface EnsureRepoProps {
  git: typeof Git;
  fs: PromiseFsClient;
  dir: string;
}
export async function ensureRepo({ git, fs, dir }: EnsureRepoProps) {
  try {
    await git.findRoot({
      fs,
      filepath: dir,
    });
  } catch (error) {
    if ((error as any)?.code === "ENOENT") {
      await git.init({
        fs,
        dir,
      });
    }
  }
}
