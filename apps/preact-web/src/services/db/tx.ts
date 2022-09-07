import { AppDB, ChangeType, DraftFrameSchema, FrameSchema } from "./db";
import { tx } from "./utils";

export async function resetDb(db: AppDB, items: FrameSchema[], baseRef: string) {
  return tx(db, ["frame", "baseRef", "draftFrame"], "readwrite", (tx) => {
    tx.objectStore("draftFrame").clear();

    const frameStore = tx.objectStore("frame");
    frameStore.clear();
    items.forEach((item) => frameStore.put(item));

    const baseRefStore = tx.objectStore("baseRef");
    baseRefStore.clear();
    baseRefStore.add(baseRef);
  });
}

export async function getRecentFrames<T>(db: AppDB, limit = 10): Promise<FrameSchema[]> {
  return tx(db, ["frame", "draftFrame"], "readwrite", async (tx) => {
    const results: FrameSchema[] = [];
    let cursor = await tx.objectStore("frame").index("byDateUpdated").openCursor();
    while (cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }

    return results;
  });
}

export async function getDraftFrames<T>(db: AppDB, limit: number | undefined = undefined): Promise<DraftFrameSchema[]> {
  return tx(db, ["draftFrame"], "readonly", async (tx) => tx.objectStore("draftFrame").index("byDateUpdated").getAll(undefined, limit));
}

export async function getFrame(db: AppDB, id: string): Promise<FrameSchema | undefined> {
  return tx(db, "frame", "readonly", async (tx) => tx.objectStore("frame").get(id));
}

export async function putDraftFrame(db: AppDB, frame: FrameSchema) {
  return tx(db, ["frame", "draftFrame"], "readwrite", async (tx) => {
    const frameStore = tx.objectStore("frame");
    const draftFrameStore = tx.objectStore("draftFrame");
    const existingFrame = await frameStore.get(frame.id);

    const changeType = getChangeType(existingFrame?.content ?? null, frame.content);

    if (changeType === ChangeType.Clean) {
      draftFrameStore.delete(frame.id);
    } else {
      draftFrameStore.put({
        id: frame.id,
        content: frame.content,
        changeType,
        dateUpdated: new Date(),
      });
    }
  });
}

function getChangeType(existingContent: string | null, content: string | null): ChangeType {
  if (existingContent === content) return ChangeType.Clean;
  else if (existingContent === null) return ChangeType.Create;
  else if (content === null) return ChangeType.Delete;
  return ChangeType.Update;
}
