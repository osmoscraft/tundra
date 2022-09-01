import { DBSchema, IDBPDatabase, openDB } from "idb";

export interface FileStoreSchema extends DBSchema {
  frame: {
    value: FrameSchema;
    key: string;
    indexes: {
      byVisitorId: string;
    };
  };
}

export interface FrameSchema {
  id: string;
  body: string;
  header: FrameHeaderSchema;
  visitorIds: string[];
}

export interface FrameHeaderSchema {
  created: Date;
  modified: Date;
}

export type FileStore = IDBPDatabase<FileStoreSchema>;

export async function openFileStore() {
  return openDB<FileStoreSchema>("tkb-file-store", 1, {
    upgrade(db) {
      const frameStore = db.createObjectStore("frame", {
        keyPath: "id",
      });

      frameStore.createIndex("byVisitorId", "visitorIds", { multiEntry: true });
    },
  });
}
