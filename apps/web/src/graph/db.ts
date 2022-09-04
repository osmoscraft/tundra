import { DBSchema, IDBPDatabase, openDB } from "idb";

export interface GraphDBSchema extends DBSchema {
  frame: {
    value: FrameSchema;
    key: string;
    indexes: {
      byStatus: ChangeStatus;
      byToken: string;
      byDateUpdated: Date;
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
  dateUpdated: Date;
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

export type GraphDB = IDBPDatabase<GraphDBSchema>;

export async function openGraphDB(): Promise<GraphDB> {
  return openDB<GraphDBSchema>("tkb-graph-store", 1, {
    upgrade(db, _oldVersion, _newVersion, _transaction) {
      const frameStore = db.createObjectStore("frame", {
        keyPath: "id",
      });

      frameStore.createIndex("byStatus", "status");
      frameStore.createIndex("byDateUpdated", "dateUpdated");
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
}
