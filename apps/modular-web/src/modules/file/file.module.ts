import { memoizeZeroArity } from "../../utils/memoize";
import { openFileStore } from "./file-store";

export class FileModule extends EventTarget {
  #getStore = memoizeZeroArity(openFileStore);

  async installModules(moduleIds: string[]) {
    const store = await this.#getStore();

    const tx = store.transaction("frame", "readwrite");
    let cursor = await tx.objectStore("frame").openCursor();

    while (cursor) {
      cursor.update({ ...cursor.value, visitorIds: [...new Set([...cursor.value.visitorIds, ...moduleIds])] });
      cursor = await cursor.continue();
    }

    await tx.done;
  }
}
