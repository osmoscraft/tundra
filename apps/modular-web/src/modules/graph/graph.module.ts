import { memoizeZeroArity } from "../../utils/memoize";
import { unique } from "../../utils/unique";
import { openGraphStore } from "./graph-store";

export class GraphModule extends EventTarget {
  #getStore = memoizeZeroArity(openGraphStore);

  async installModules(moduleIds: string[]) {
    const store = await this.#getStore();

    const tx = store.transaction("node", "readwrite");
    let cursor = await tx.objectStore("node").openCursor();

    while (cursor) {
      cursor.update({ ...cursor.value, visitorIds: unique([...cursor.value.visitorIds, ...moduleIds]) });
      cursor = await cursor.continue();
    }

    await tx.done;
  }
}
