import { DBSchema, IDBPDatabase, openDB } from "idb";

export interface AppDBSchema extends DBSchema {
  frame: {
    value: Frame;
    key: string;
    indexes: {
      byDateUpdated: Date;
    };
  };
  localChange: {
    value: LocalChangeItem;
    key: string;
  };
  remoteChange: {
    value: RemoteChangeItem;
    key: string;
  };
  localBaseSha: {
    value: string;
    key: number;
  };
}

export interface Frame {
  id: string;
  content: string;
  dateUpdated: Date;
  isDeleted?: boolean;
}

export interface LocalChangeItem {
  id: string;
  content: string | null;
  previousContent: string | null;
}

export interface RemoteChangeItem {
  id: string;
  content: string | null;
}

export type AppDB = IDBPDatabase<AppDBSchema>;

export async function openAppDB(): Promise<AppDB> {
  return openDB<AppDBSchema>("tkb-app-db", 1, {
    upgrade(db, _oldVersion, _newVersion, _transaction) {
      const frameStore = db.createObjectStore("frame", { keyPath: "id" });
      frameStore.createIndex("byDateUpdated", "dateUpdated");

      db.createObjectStore("localChange", { keyPath: "id" });
      db.createObjectStore("remoteChange", { keyPath: "id" });
      db.createObjectStore("localBaseSha", { autoIncrement: true });
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
}

export const appDB = openAppDB();
