import type { PromisifiedFS } from "@isomorphic-git/lightning-fs";
import path from "@isomorphic-git/lightning-fs/src/path";

export async function ensureDir({ fs, dir }: { fs: PromisifiedFS; dir: string }) {
  try {
    await fs.stat(dir);
  } catch (error) {
    if ((error as any)?.code === "ENOENT") {
      await ensureDir({ fs, dir: path.dirname(dir) });
      await fs.mkdir(dir);
    }
  }
}
