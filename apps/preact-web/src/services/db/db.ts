import { DBSchema, IDBPDatabase, openDB } from "idb";
import { once } from "../../utils/once";

export interface AppDBSchema extends DBSchema {
  frame: {
    value: FrameSchema;
    key: string;
    indexes: {
      byDateUpdated: Date;
    };
  };
  localChange: {
    value: LocalChangeItem;
    key: string;
  };
  localBaseSha: {
    value: string;
    key: number;
  };
}

export interface FrameSchema {
  id: string;
  content: string;
  dateUpdated: Date;
  isDeleted?: boolean;
}

export interface LocalChangeItem {
  id: string;
  previousContent: string | null;
  changeType: ChangeType;
}

export enum ChangeType {
  Clean = 0,
  Create = 1,
  Update = 2,
  Delete = 3,
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

export const getAppDB = once(openAppDB);
