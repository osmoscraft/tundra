import { AppDB, ChangeType, DraftFrameSchema, FrameSchema } from "./db";
import { tx } from "./tx";

export async function resetDb(db: AppDB, items: FrameSchema[], commitSha: string) {
  return tx(db, ["frame", "baseRef", "draftFrame"], "readwrite", (tx) => {
    tx.objectStore("draftFrame").clear();

    const frameStore = tx.objectStore("frame");
    frameStore.clear();
    items.forEach((item) => frameStore.put(item));

    const baseRefStore = tx.objectStore("baseRef");
    baseRefStore.clear();
    baseRefStore.add({ sha: commitSha });
  });
}

export async function getRecentFrames(db: AppDB, limit = 10): Promise<FrameSchema[]> {
  return tx(db, ["frame"], "readwrite", async (tx) => {
    const results: FrameSchema[] = [];
    let cursor = await tx.objectStore("frame").index("byDateUpdated").openCursor();
    while (cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }

    return results;
  });
}

export async function getDraftFrames(db: AppDB): Promise<DraftFrameSchema[]> {
  return tx(db, ["draftFrame"], "readonly", async (tx) => tx.objectStore("draftFrame").index("byDateUpdated").getAll());
}

export async function getActiveFrame(db: AppDB, id: string): Promise<FrameSchema | DraftFrameSchema | undefined> {
  return tx(db, ["frame", "draftFrame"], "readonly", async (tx) => {
    const draft = await tx.objectStore("draftFrame").get(id);
    if (draft) return draft;
    const frame = await tx.objectStore("frame").get(id);
    return frame;
  });
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

export async function getLocalBaseCommit(db: AppDB) {
  let commit: string | undefined;
  const tx = db.transaction("baseRef", "readonly");
  const cursor = await tx.objectStore("baseRef").openCursor(null, "prev");
  if (cursor?.value) {
    commit = cursor?.value.sha;
  }
  await tx.done;

  return commit;
}

export interface FrameChangeItem {
  changeType: ChangeType;
  id: string;
  content: string;
}
export async function applyFrameChanges(db: AppDB, changes: FrameChangeItem[], commitSha: string) {
  return tx(db, ["frame", "baseRef"], "readwrite", async (tx) => {
    const frameStore = tx.objectStore("frame");

    changes.map((change) => {
      switch (change.changeType) {
        case ChangeType.Create:
        case ChangeType.Update:
          frameStore.put({
            id: change.id,
            content: change.content,
            dateUpdated: new Date(),
          });
          break;
        case ChangeType.Delete:
          frameStore.delete(change.id);
          break;
        default:
          break;
      }
    });

    tx.objectStore("baseRef").add({ sha: commitSha });
  });
}

export async function applyDrafts(db: AppDB, changes: DraftFrameSchema[], commitSha: string) {
  return tx(db, ["frame", "draftFrame", "baseRef"], "readwrite", async (tx) => {
    const frameStore = tx.objectStore("frame");
    const draftFrameStore = tx.objectStore("draftFrame");

    changes.map(async (change) => {
      switch (change.changeType) {
        case ChangeType.Create:
        case ChangeType.Update:
          frameStore.put({
            id: change.id,
            content: change.content,
            dateUpdated: new Date(),
          });
          break;
        case ChangeType.Delete:
          frameStore.delete(change.id);
          break;
        default:
          console.warn("Unsupported file status", ChangeType.Delete);
          break;
      }

      const draft = await draftFrameStore.get(change.id);
      // prevent merge conflict by making sure the draft hasn't changed since the commit
      if (draft?.content === change.content) {
        draftFrameStore.delete(change.id);
      }
    });

    tx.objectStore("baseRef").add({ sha: commitSha });
  });
}
