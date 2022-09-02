import { DBSchema, IDBPDatabase, openDB } from "idb";

export interface GraphStoreSchema extends DBSchema {
  node: {
    value: NodeSchema;
    key: string;
    indexes: {
      byStatus: ChangeStatus;
      byTargetNodeId: string;
    };
  };
  syncRecord: {
    value: SyncRecordSchema;
    key: number;
  };
}

export interface NodeSchema {
  id: string;
  body: string | null;
  header: HeaderSchema;
  status: ChangeStatus;
  targetNodeIds: string[];
  isDeleted: boolean;
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

      db.createObjectStore("syncRecord", { autoIncrement: true });
    },
  });
}
