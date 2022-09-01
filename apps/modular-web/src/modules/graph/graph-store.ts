import { DBSchema, IDBPDatabase, openDB } from "idb";

export interface GraphStoreSchema extends DBSchema {
  node: {
    value: FrameSchema;
    key: string;
    indexes: {
      byStatus: ChangeStatus;
      byTargetNodeId: string;
      byVisitorId: string;
    };
  };
  syncRecord: {
    value: SyncRecordSchema;
    key: number;
  };
}

export interface FrameSchema {
  id: string;
  body: string;
  header: HeaderSchema;
  status: ChangeStatus;
  targetNodeIds: string[];
  visitorIds: string[];
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

export interface SyncRecordSchema {
  dateSynced: Date;
  commit: string;
}

export type GraphStore = IDBPDatabase<GraphStoreSchema>;

export async function openGraphStore() {
  return await openDB<GraphStoreSchema>("app-db", 1, {
    upgrade(db, _oldVersion, _newVersion, _transaction) {
      const nodeStore = db.createObjectStore("node", {
        keyPath: "id",
      });

      nodeStore.createIndex("byStatus", "status");
      nodeStore.createIndex("byTargetNodeId", "targetNodeIds", { multiEntry: true });
      nodeStore.createIndex("byVisitorId", "visitorIds", { multiEntry: true });

      db.createObjectStore("syncRecord", { autoIncrement: true });
    },
  });
}
