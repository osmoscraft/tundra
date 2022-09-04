import { getFileModule, openFileStore } from "./modules/file";
import { getSearchModule } from "./modules/search";
import { getSyncModule, openSyncStore } from "./modules/sync";

export async function main() {
  console.log("App initialized");
  performance.mark("start");

  const searchModule = getSearchModule();

  const syncModule = getSyncModule({
    syncStore: await openSyncStore(),
  });

  const fileModule = getFileModule({
    fileStore: await openFileStore(),
    onChange: (files) => {
      searchModule.handleChange(files);
      syncModule.handleChange(files);
    },
    onDelete: (files) => searchModule.handleDelete(files),
  });

  const all = await fileModule.getAllFiles();
  searchModule.handleChange(all);

  console.log(performance.measure("duration", "start").duration.toFixed(2));
}

main();
