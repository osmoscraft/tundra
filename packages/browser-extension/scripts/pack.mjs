import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import { UNPACKED_OUT_DIR } from "./config.mjs";
import { readJson } from "./fs.mjs";

const execAsync = promisify(exec);

async function pack() {
  console.log(path.resolve(UNPACKED_OUT_DIR));
  const manifest = await readJson(path.resolve(UNPACKED_OUT_DIR, "manifest.json"));
  const version = manifest.version;
  const outFilename = `tinykb-${version}.chrome.zip`;

  await execAsync(`zip -r ../${outFilename} .`, { cwd: UNPACKED_OUT_DIR });

  console.log(`[pack] packed: ${outFilename}`);
}

pack();
