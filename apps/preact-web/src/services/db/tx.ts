import { AppDB, ChangeType, FrameSchema, LocalChangeItem } from "./db";
import { tx } from "./utils";

export async function resetTx(db: AppDB, items: FrameSchema[], localBaseSha: string) {
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

export async function getRecentFramesTx<T>(db: AppDB, resolveFrame: (frame: FrameSchema, localChangeItem?: LocalChangeItem) => T, limit = 10): Promise<T[]> {
  return tx(db, ["frame", "localChange"], "readwrite", async (tx) => {
    const frameStore = tx.objectStore("frame");
    const localChangeStore = tx.objectStore("localChange");

    const results: FrameSchema[] = [];
    let cursor = await frameStore.index("byDateUpdated").openCursor();
    while (cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }

    return Promise.all(results.map(async (result) => resolveFrame(result, await localChangeStore.get(result.id))));
  });
}

export async function getFrameTx(db: AppDB, id: string): Promise<FrameSchema | undefined> {
  return tx(db, "frame", "readonly", async (tx) => tx.objectStore("frame").get(id));
}

export async function putChangedFrame(db: AppDB, frame: FrameSchema) {
  return tx(db, ["frame", "localChange"], "readwrite", async (tx) => {
    const frameStore = tx.objectStore("frame");
    const localChangeStore = tx.objectStore("localChange");
    const previousFrame = await frameStore.get(frame.id);

    frameStore.put(frame);

    const existingChange = await localChangeStore.get(frame.id);
    const previousContent = existingChange ? existingChange.content : previousFrame ? previousFrame.content : null;
    const changeType = getChangeType(previousContent, frame.content);

    if (changeType === ChangeType.Clean) {
      localChangeStore.delete(frame.id);
    } else {
      localChangeStore.put({
        id: frame.id,
        content: frame.content,
        previousContent,
        changeType,
      });
    }
  });
}

function getChangeType(previousContent: string | null, content: string | null): ChangeType {
  if (previousContent === content) return ChangeType.Clean;
  else if (previousContent === null) return ChangeType.Create;
  else if (content === null) return ChangeType.Delete;
  return ChangeType.Update;
}
