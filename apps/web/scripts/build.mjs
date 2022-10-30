import fs from "fs/promises";
import path from "path";
import { OUT_DIR, UNPACKED_OUT_DIR } from "./config.mjs";

const isWatch = process.argv.includes("--watch");

/**
 * @param {boolean} isWatch
 * @param {string} name
 */
const getWatcher = (isWatch, name) =>
  isWatch
    ? {
        onRebuild: (/** @type {any} */ error) => {
          if (error) {
            console.error(`[watch] ${name} rebuild error`, error);
          } else {
            console.log(`[watch] ${name} rebuild success`);
          }
        },
      }
    : undefined;

async function build() {
  console.log(`[build] remove ${OUT_DIR}`);

  const manifestBuild = (async function () {
    await fs.mkdir(path.resolve(UNPACKED_OUT_DIR), { recursive: true });
    await fs.copyFile(path.resolve("src/manifest.json"), path.join(UNPACKED_OUT_DIR, "manifest.json"));
    console.log("[build] manifest copied");

    const watcher = getWatcher(isWatch, "manifest");

    isWatch &&
      (async () => {
        try {
          for await (const _change of fs.watch(path.resolve("src"), { recursive: true })) {
            await fs.copyFile(path.resolve("src/manifest.json"), path.join(UNPACKED_OUT_DIR, "manifest.json"));
            watcher?.onRebuild();
          }
        } catch (error) {
          watcher?.onRebuild(error);
        }
      })();
  })();

  await Promise.all([manifestBuild]);
  console.log(`[build] build success`);
}

build();
