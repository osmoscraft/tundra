import { OUT_DIR } from "./config.mjs";
import { rmDir } from "./fs.mjs";

async function main() {
  await rmDir(OUT_DIR);
}

main();
