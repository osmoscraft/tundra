import { AppDB, Frame, LocalChangeItem } from "./db";
import { tx } from "./utils";

export async function resetTx(db: AppDB, items: Frame[], localBaseSha: string) {
  return tx(db, ["frame", "localBaseSha", "localChange", "remoteChange"], "readwrite", (tx) => {
    tx.objectStore("localChange").clear();
    tx.objectStore("remoteChange").clear();

    const frameStore = tx.objectStore("frame");
    frameStore.clear();
    items.forEach((item) => frameStore.put(item));

    const localBaseRefStore = tx.objectStore("localBaseSha");
    localBaseRefStore.clear();
    localBaseRefStore.add(localBaseSha);
  });
}

export async function getRecentFramesTx<T>(db: AppDB, joinFn: (dbFrame: Frame, localChangeFrame?: LocalChangeItem) => T, limit = 10): Promise<T[]> {
  return tx(db, ["frame", "localChange"], "readwrite", async (tx) => {
    const frameStore = tx.objectStore("frame");
    const localChangeStore = tx.objectStore("localChange");

    const results: Frame[] = [];
    let cursor = await frameStore.index("byDateUpdated").openCursor();
    while (cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }

    return Promise.all(results.map(async (result) => joinFn(result, await localChangeStore.get(result.id))));
  });
}
