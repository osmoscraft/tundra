import { FileModule } from "./modules/file/file.module";

async function main() {
  const fileModule = new FileModule();

  await fileModule.installModules(["foo", "bar"]);

  console.log("App initialized");
}

main();
