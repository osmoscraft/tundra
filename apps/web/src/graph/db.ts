import { DBSchema, IDBPDatabase, openDB } from "idb";

export interface AppStoreSchema extends DBSchema {
  frame: {
    value: FrameSchema;
    key: string;
    indexes: {
      byStatus: ChangeStatus;
      byToken: string;
      byDateModified: Date;
    };
  };
  history: {
    value: HistoryRecord;
    key: number;
  };
}

export interface FrameSchema {
  id: string;
  body: string;
  header: HeaderSchema;
  status: ChangeStatus;
}

export interface HeaderSchema {
  dateCreated: Date;
  dateModified: Date;
}

export enum ChangeStatus {
  Clean = 0,
  Create = 1,
  Update = 2,
  Delete = 3,
}

export interface HistoryRecord {
  dateSynced: Date;
  commit: string;
}

export type AppStore = IDBPDatabase<AppStoreSchema>;

let instance: AppStore;

export async function getDb() {
  if (instance) return instance;
  instance = await openDB<AppStoreSchema>("app-db", 1, {
    upgrade(db, _oldVersion, _newVersion, _transaction) {
      const frameStore = db.createObjectStore("frame", {
        keyPath: "id",
      });

      frameStore.createIndex("byStatus", "status");
      frameStore.createIndex("byDateModified", "dateModified");
      frameStore.createIndex("byToken", "tokens", { multiEntry: true });

      db.createObjectStore("history", { autoIncrement: true });
    },
    blocked() {
      // …
    },
    blocking() {
      // …
    },
    terminated() {
      // …
    },
  });

  return instance;
}
