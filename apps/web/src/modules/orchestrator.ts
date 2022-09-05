import { ChangesetModule } from "./changeset.module";
import { StorageModule, WriteFileRequest } from "./storage.module";

export async function testModules() {
  const storage = new StorageModule();
  const changeset = new ChangesetModule();

  storage.on("change", (items) => changeset.addLocal(items));

  const saveFrame = (req: WriteFileRequest) => storage.write([req]);
}
