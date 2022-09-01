import { DBSchema, IDBPDatabase, openDB } from "idb";

export interface AppDb extends DBSchema {
  frame: {
    value: SchemaFrame;
    key: string;
    indexes: {
      byStatus: ChangeStatus;
      byTokens: string;
    };
  };
  sync: {
    value: SchemaSyncRecord;
    key: number;
  };
}

export interface SchemaFrame {
  id: string;
  body: string;
  header: SchemaHeader;
  status: ChangeStatus;
  tokens: string[];
}

export interface SchemaHeader {
  btime: Date;
  ctime: Date;
}

export enum ChangeStatus {
  Clean = 0,
  Create = 1,
  Update = 2,
  Delete = 3,
}

export interface SchemaSyncRecord {
  syncedOn: Date;
  commit: string;
}

export type TkbDb = IDBPDatabase<AppDb>;

let instance: TkbDb;

export async function getDb() {
  if (instance) return instance;
  instance = await openDB<AppDb>("app-db", 1, {
    upgrade(db, _oldVersion, _newVersion, _transaction) {
      const frameStore = db.createObjectStore("frame", {
        keyPath: "id",
      });

      frameStore.createIndex("byStatus", "status");
      frameStore.createIndex("byTokens", "tokens", { multiEntry: true });

      db.createObjectStore("sync", { autoIncrement: true });
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
