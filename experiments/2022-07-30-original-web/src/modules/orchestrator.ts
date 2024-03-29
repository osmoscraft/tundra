import { SearchModule } from "./search.module";
import { StorageModule, WriteFileRequest } from "./storage.module";
import { GitHubSyncModule } from "./sync.module";

export async function testModules() {
  const storage = new StorageModule();
  const sync = new GitHubSyncModule();
  const search = new SearchModule();

  storage.on("change", (items) => sync.addLocal(items));
  storage.on("change", (items) => search.updateIndex(items));
  sync.on("remoteChanged", (data) => storage.write(data));

  const clone = async () => {
    await storage.clear();
    await search.clear();
    sync.clone();
  };

  const saveFrame = (req: WriteFileRequest) => storage.write([req]);

  const pull = () => {
    sync.fetch();
  };
  const push = () => {
    sync.push();
  };

  const keywordSearch = () => {
    return search.search("");
  };
}
