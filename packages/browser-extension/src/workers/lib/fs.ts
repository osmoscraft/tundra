import type { PromisifiedFS } from "@isomorphic-git/lightning-fs";
import path from "@isomorphic-git/lightning-fs/src/path";

export async function ensureDir(fs: PromisifiedFS, dir: string) {
  try {
    await fs.stat(dir);
  } catch (error) {
    if ((error as any)?.code === "ENOENT") {
      await ensureDir(fs, path.dirname(dir));
      await fs.mkdir(dir);
    }
  }
}

export async function readFilesInDir(fs: PromisifiedFS, dir: string) {
  try {
    const nodeFiles = await fs.readdir(dir);
    const files = await Promise.all(nodeFiles.map((file) => fs.readFile(`${dir}/${file}`, { encoding: "utf8" })));
    return files;
  } catch {
    return [];
  }
}
