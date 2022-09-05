import { SearchModule } from "./search.module";
import { StorageModule, WriteFileRequest } from "./storage.module";
import { SyncModule } from "./sync.module";

export async function testModules() {
  const storage = new StorageModule();
  const sync = new SyncModule();
  const search = new SearchModule();

  storage.on("change", (items) => sync.addLocal(items));
  storage.on("change", (items) => search.updateIndex(items));
  sync.on("remoteChanged", (data) => storage.write(data));

  const saveFrame = (req: WriteFileRequest) => storage.write([req]);

  const pull = () => {
    sync.pull();
  };
  const push = () => {
    sync.push();
  };
}
