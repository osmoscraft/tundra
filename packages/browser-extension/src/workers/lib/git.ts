import type { PromisifiedFS } from "@isomorphic-git/lightning-fs";
import type Git from "../vendor/isomorphic-git/index.umd.min";
export interface EnsureRepoProps {
  git: typeof Git;
  fs: PromisifiedFS;
  dir: string;
}
export async function ensureRepo({ git, fs, dir }: EnsureRepoProps) {
  try {
    await git.findRoot({
      fs: { promises: fs },
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
