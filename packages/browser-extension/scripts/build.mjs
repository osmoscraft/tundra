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
  console.log("[build] start building extension...");

  console.log(`[build] remove ${OUT_DIR}`);

  await rmDir(OUT_DIR);

  const mainEntries = await getFilesByExtension(path.resolve("src/modules/client"), ".ts");
  const mainBuild = esbuild
    .build({
      entryPoints: mainEntries,
      bundle: true,
      format: "esm",
      sourcemap: "inline",
      watch: getWatcher(isWatch, "main"),
      minify: !isWatch,
      outdir: path.join(UNPACKED_OUT_DIR, "modules/client"),
    })
    .catch(() => process.exit(1))
    .then(() => console.log(`[build] main built`));

  const contentScriptEntries = await getFilesByExtension(path.resolve("src/modules/content-script"), ".ts");
  const contentScriptBuild = esbuild
    .build({
      entryPoints: contentScriptEntries,
      bundle: true,
      format: "iife",
      sourcemap: "inline",
      globalName: "_contentScriptGlobal",
      footer: { js: "_contentScriptGlobal.default()" }, // this allows the default export to be returned to global scope
      watch: getWatcher(isWatch, "content script"),
      minify: !isWatch,
      outdir: path.join(UNPACKED_OUT_DIR, "modules/content-script"),
    })
    .catch(() => process.exit(1))
    .then(() => console.log(`[build] content script built`));

  const workerBuild = esbuild
    .build({
      entryPoints: ["src/modules/server/worker.ts"],
      bundle: true,
      format: "iife",
      sourcemap: "inline",
      watch: getWatcher(isWatch, "worker"),
      minify: !isWatch,
      outdir: path.join(UNPACKED_OUT_DIR, "modules/server"),
    })
    .catch(() => process.exit(1))
    .then(() => console.log(`[build] worker built`));

  const styleEntries = await getFilesByExtension(path.resolve("src/modules/client"), ".css");
  const styleBuild = esbuild
    .build({
      entryPoints: styleEntries,
      bundle: true,
      sourcemap: "inline",
      watch: getWatcher(isWatch, "styles"),
      minify: !isWatch,
      outdir: path.join(UNPACKED_OUT_DIR, "modules/client"),
    })
    .catch(() => process.exit(1))
    .then(() => {
      console.log(`[build] styles built`);
    });

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

  await Promise.all([mainBuild, contentScriptBuild, workerBuild, styleBuild, assetBuild, manifestBuild]);
}

build();
