import { getFileModule } from "./modules/file";
import { getSearchModule } from "./modules/search";

export async function main() {
  console.log("App initialized");
  performance.mark("start");

  const fileModule = getFileModule({
    onChange: (files) => files.map((file) => searchModule.add(file.id, file.body)),
    onDelete: (files) => files.map((file) => searchModule.remove(file.id)),
  });
  const searchModule = getSearchModule();

  const all = await fileModule.getAllFiles();
  all.map((file) => searchModule.add(file.id, file.body));

  const foundIds = await searchModule.search("test");
  const ids = [...foundIds] as string[];

  console.log(await fileModule.getFiles(ids));
  console.log(performance.measure("duration", "start").duration.toFixed(2));
}

main();
