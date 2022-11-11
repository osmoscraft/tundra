import esbuild from "esbuild";
import fs from "fs/promises";
import path from "path";
import { OUT_DIR, UNPACKED_OUT_DIR } from "./config.mjs";
import { copyDir, getFilesByExtension, rmDir } from "./fs.mjs";

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
  console.log("[build] build started");

  console.log(`[build] remove ${OUT_DIR}`);

  await rmDir(OUT_DIR);

  const workerScriptEntries = await getFilesByExtension(path.resolve("src/workers"), ".ts");
  const workerBuild = esbuild
    .build({
      entryPoints: workerScriptEntries,
      bundle: true,
      format: "iife",
      sourcemap: "inline",
      watch: getWatcher(isWatch, "worker"),
      minify: !isWatch,
      outdir: path.join(UNPACKED_OUT_DIR, "workers"),
    })
    .catch(() => process.exit(1))
    .then(() => console.log(`[build] worker built`));

  const assetBuild = (async function () {
    await copyDir(path.resolve("src/public"), UNPACKED_OUT_DIR);
    console.log("[build] assets copied");

    const watcher = getWatcher(isWatch, "assets");

    isWatch &&
      (async () => {
        try {
          for await (const _change of fs.watch(path.resolve("src/public"), { recursive: true })) {
            copyDir(path.resolve("src/public"), UNPACKED_OUT_DIR);
            watcher?.onRebuild();
          }
        } catch (error) {
          watcher?.onRebuild(error);
        }
      })();
  })();

  const manifestBuild = (async function () {
    await fs.mkdir(path.resolve(UNPACKED_OUT_DIR), { recursive: true });
    await fs.copyFile(path.resolve("src/manifest.json"), path.join(UNPACKED_OUT_DIR, "manifest.json"));
    console.log("[build] manifest copied");

    const watcher = getWatcher(isWatch, "manifest");

    isWatch &&
      (async () => {
        try {
          for await (const _change of fs.watch(path.resolve("src/manifest.json"))) {
            await fs.copyFile(path.resolve("src/manifest.json"), path.join(UNPACKED_OUT_DIR, "manifest.json"));
            watcher?.onRebuild();
          }
        } catch (error) {
          watcher?.onRebuild(error);
        }
      })();
  })();

  await Promise.all([workerBuild, assetBuild, manifestBuild]);
  console.log(`[build] build success`);
}

build();
