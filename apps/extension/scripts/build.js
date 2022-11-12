import { exec } from "child_process";
import esbuild from "esbuild";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import { copyDir, filterDir, getDirEntryPath, getDirsRecursive, readJson, rmDir } from "./fs.js";

const execAsync = promisify(exec);

const constants = {
  OUT_DIR: `dist`, // relative to cwd
  UNPACKED_OUT_DIR: `dist/unpacked`, // relative to cwd
  PUBLIC_DIR: `public`, // relative to cwd
  SRC_DIR: `src`, // relative to cwd
  PAGE_ENTRIES: ["options.ts", "popup.ts"], // relative to src
  CONTENT_SCRIPT_ENTRIES: [], // relative to src
  WORKER_ENTRIES: ["worker.ts"], // relative to src
};

const isDev = process.argv.includes("--dev");

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
  console.log(`[build] remove ${constants.OUT_DIR}`);
  await rmDir(constants.OUT_DIR);

  const srcDir = path.resolve(constants.SRC_DIR);
  const getSrcEntryPath = getDirEntryPath.bind(null, srcDir);
  const filterInSrcDir = filterDir.bind(null, srcDir);

  const pageEntries = await filterInSrcDir((dirent) => dirent.isFile() && constants.PAGE_ENTRIES.includes(dirent.name));
  const pagePaths = pageEntries.map(getSrcEntryPath);
  console.log(`[build] page entries`, pagePaths);

  const workerEntries = await filterInSrcDir(
    (dirent) => dirent.isFile() && constants.WORKER_ENTRIES.includes(dirent.name)
  );
  const workerPaths = workerEntries.map(getSrcEntryPath);
  console.log(`[build] worker entries`, workerPaths);

  const mainBuild = esbuild
    .build({
      entryPoints: pagePaths,
      bundle: true,
      format: "esm",
      sourcemap: true,
      watch: getWatcher(isDev, "main"),
      minify: !isDev,
      outdir: constants.UNPACKED_OUT_DIR,
    })
    .catch(() => process.exit(1))
    .then(() => console.log(`[build] main built`));

  const contentScriptBuild = esbuild
    .build({
      entryPoints: [], // No implemented yet
      bundle: true,
      format: "iife",
      sourcemap: "inline",
      globalName: "_contentScriptGlobal",
      footer: { js: "_contentScriptGlobal.default()" }, // this allows the default export to be returned to global scope
      watch: getWatcher(isDev, "content script"),
      minify: !isDev,
      outdir: path.join(constants.UNPACKED_OUT_DIR, "content-scripts"),
    })
    .catch(() => process.exit(1))
    .then(() => console.log(`[build] content script built`));

  const workerBuild = esbuild
    .build({
      entryPoints: workerPaths,
      bundle: true,
      format: "iife",
      sourcemap: "inline", // TODO try external source map for performance improvement
      watch: getWatcher(isDev, "worker"),
      minify: !isDev,
      outdir: constants.UNPACKED_OUT_DIR,
    })
    .catch(() => process.exit(1))
    .then(() => console.log(`[build] worker built`));

  const assetCopy = (async () => {
    const publicSrcDir = path.resolve(constants.PUBLIC_DIR);
    const { targetPaths } = await copyDir(publicSrcDir, constants.UNPACKED_OUT_DIR);
    console.log("[build] assets copied", targetPaths);

    const watcher = getWatcher(isDev, "assets");

    const copyFilesOnChange = async () => {
      try {
        // TODO remove manually recursion once the cursive watch option works on Linux,
        // Ref: https://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener
        const dirs = await getDirsRecursive(publicSrcDir);
        const ac = new AbortController();
        const { signal } = ac;
        console.log(`[build] watching ${dirs.length} directories`);
        dirs
          .map((dir) => fs.watch(dir, { recursive: false, signal }))
          .forEach(async (watchPoint) => {
            try {
              for await (const _change of watchPoint) {
                ac.abort();
                const { targetPaths } = await copyDir(publicSrcDir, constants.UNPACKED_OUT_DIR);
                console.log("[build] assets copied", targetPaths);
                watcher?.onRebuild();
                copyFilesOnChange();
              }
            } catch {
              // abort error is ok
            }
          });
      } catch (error) {
        watcher?.onRebuild(error);
      }
    };

    isDev && copyFilesOnChange();
  })();

  await Promise.all([mainBuild, contentScriptBuild, workerBuild, assetCopy]);
  console.log(`[build] build success`);
}

async function pack() {
  console.log("[pack] extension dir", path.resolve(constants.UNPACKED_OUT_DIR));
  const manifest = await readJson(path.resolve(constants.UNPACKED_OUT_DIR, "manifest.json"));
  const version = manifest.version;
  const outFilename = `tinykb-${version}.chrome.zip`;

  await execAsync(`zip -r ../${outFilename} .`, { cwd: constants.UNPACKED_OUT_DIR });

  console.log(`[pack] packed: ${outFilename}`);
}

build().then(() => {
  if (!isDev) pack();
});
