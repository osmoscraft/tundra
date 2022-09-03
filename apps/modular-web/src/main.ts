import { addFile, rwTxFile } from "./modules/file/file";

export async function main() {
  console.log("App initialized");

  await rwTxFile((store) => addFile(store, { body: "new file" }));
}

main();
