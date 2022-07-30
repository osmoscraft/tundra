import { DBSchema, IDBPDatabase, openDB } from "idb";

export interface TkbSchema extends DBSchema {
  frame: {
    value: {
      id: string;
      body: string;
      header: {
        btime: Date;
        ctime: Date;
      };
      status: ChangeStatus;
    };
    key: string;
    indexes: {
      byStatus: ChangeStatus;
    };
  };
  sync: {
    value: {
      syncedOn: Date;
      commit: string;
    };
    key: number;
  };
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

export type TkbDb = IDBPDatabase<TkbSchema>;

let instance: TkbDb;

export async function getDb() {
  if (instance) return instance;
  instance = await openDB<TkbSchema>("tkb-main-db", 1, {
    upgrade(db, oldVersion, newVersion, transaction) {
      const frameStore = db.createObjectStore("frame", {
        keyPath: "id",
      });

      frameStore.createIndex("byStatus", "status");

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
