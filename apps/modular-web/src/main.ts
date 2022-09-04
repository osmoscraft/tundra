import { FileSchema, getFileModule, openFileStore } from "./modules/file";
import { getGitHubContext } from "./modules/github";
import { getSearchModule } from "./modules/search";
import { getSyncModule, openSyncStore } from "./modules/sync";

export async function main() {
  console.log("App initialized");
  performance.mark("start");
  const fileEvents = new EventTarget();
  const syncEvents = new EventTarget();
  const context = await getGitHubContext();

  const searchModule = getSearchModule();

  const syncModule =
    context &&
    getSyncModule({
      events: syncEvents,
      context,
      syncStore: await openSyncStore(),
    });

  const fileModule = getFileModule({
    events: fileEvents,
    fileStore: await openFileStore(),
  });

  fileEvents.addEventListener("updated", (e) => searchModule.handleChange((e as CustomEvent<FileSchema[]>).detail));
  fileEvents.addEventListener("deleted", (e) => searchModule.handleDelete((e as CustomEvent<FileSchema[]>).detail));
  fileEvents.addEventListener("reset", (e) => searchModule.handleReset((e as CustomEvent<FileSchema[]>).detail));

  if (syncModule) {
    fileEvents.addEventListener("updated", (e) => syncModule.handleChange((e as CustomEvent<FileSchema[]>).detail));
    fileEvents.addEventListener("deleted", (e) => syncModule.handleDelete((e as CustomEvent<FileSchema[]>).detail));
    fileEvents.addEventListener("reset", (e) => syncModule.handleChange((e as CustomEvent<FileSchema[]>).detail));

    syncEvents.addEventListener("remote-cloned", async (e) => {
      const remoteFiles = (e as CustomEvent<FileSchema[]>).detail;
      await fileModule.hardReset(remoteFiles);
    });

    await syncModule.testConnection();
    (globalThis as any).reset = async () => {
      await syncModule.getRemoteAll();
    };
  }

  // debug
  fileEvents.addEventListener("updates", (e) => console.log("[debug] updates", e));
  fileEvents.addEventListener("deleted", (e) => console.log("[debug] deleted", e));
  fileEvents.addEventListener("reset", (e) => console.log("[debug] reset", e));
  syncEvents.addEventListener("clone-requested", (e) => console.log("[debug] clone-requested", e));

  console.log(performance.measure("duration", "start").duration.toFixed(2));
}

main();
