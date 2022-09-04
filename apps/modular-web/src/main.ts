import { FileSchema, getFileModule, openFileStore } from "./modules/file";
import { getSearchModule } from "./modules/search";
import { getSyncModule, openSyncStore } from "./modules/sync";

export async function main() {
  console.log("App initialized");
  performance.mark("start");
  const events = new EventTarget();

  const searchModule = getSearchModule();

  const syncModule = getSyncModule({
    syncStore: await openSyncStore(),
  });

  const fileModule = getFileModule({
    events,
    fileStore: await openFileStore(),
  });

  events.addEventListener("updated", (e) => syncModule.handleChange((e as CustomEvent<FileSchema[]>).detail));
  events.addEventListener("updated", (e) => searchModule.handleChange((e as CustomEvent<FileSchema[]>).detail));
  events.addEventListener("deleted", (e) => syncModule.handleDelete((e as CustomEvent<FileSchema[]>).detail));
  events.addEventListener("deleted", (e) => searchModule.handleDelete((e as CustomEvent<FileSchema[]>).detail));

  const all = await fileModule.getAllFiles();
  await searchModule.handleChange(all);
  await syncModule.handleChange(all);

  console.log(performance.measure("duration", "start").duration.toFixed(2));
}

main();
