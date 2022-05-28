import fs from "fs/promises";
import path from "path";

// credit: https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
/**
 *
 * @param {string} dir root dir
 * @returns {Promise<string[]>} a promise of the array of file paths
 */
export async function getFilesRecursive(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFilesRecursive(res) : res;
    })
  );
  return files.flat();
}

/**
 *
 * @param {string} srcDir
 * @param {string} targetDir
 */
export async function copyDir(srcDir, targetDir) {
  const srcPaths = await getFilesRecursive(srcDir);
  await Promise.all(
    srcPaths.map(async (srcPath) => {
      const relativeToSrcDir = path.relative(srcDir, srcPath);
      const targetPath = path.join(targetDir, relativeToSrcDir);
      const targetPathParent = path.dirname(targetPath);
      await fs.mkdir(targetPathParent, { recursive: true });
      await fs.copyFile(srcPath, targetPath);
    })
  );
}

/**
 *
 * @param {string} dir
 */
export async function rmDir(dir) {
  try {
    await fs.stat(dir);
    await fs.rm(path.resolve(dir), { recursive: true });
  } catch {}
}

/**
 *
 * @param {string} path
 */
export async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf-8"));
}
