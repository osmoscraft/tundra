import { migrate, Migration, openDB, storesTx } from "../utils/idb/idb";
import type { GitHubConnection } from "./github/github";

export type RemoteSchema = {
  type: RemoteType.GitHubToken;
  connection: GitHubConnection;
};

export interface FrameSchema {
  id: string;
  content: string;
  dateUpdated: Date;
  draftContent: string;
  draftDateUpdated: Date;
  status: FrameStatus;
}

export type BaseRefSchema = Ref;

export const enum FrameStatus {
  Clean = 0,
  Create = 1,
  Update = 2,
  Delete = 3,
  Conflict = 4,
}

export interface Ref {
  sha: string;
}

export interface RemoteChangeItem {
  id: string;
  content: string | null;
}

export interface FrameChangeItem {
  changeType: FrameStatus;
  id: string;
  content: string;
}

export const enum RemoteType {
  GitHubToken = 1,
}

export const migration01: Migration = (db: IDBDatabase) => {
  db.createObjectStore("frame", { keyPath: "id" });
};

export const migration02: Migration = (db: IDBDatabase) => {
  db.createObjectStore("baseRef", { autoIncrement: true });
  db.createObjectStore("remote");
};

export const migration03: Migration = (db: IDBDatabase) => {
  db.deleteObjectStore("remote");
  db.createObjectStore("remote", { autoIncrement: true });
};

export const dbAsync = openDB("tinykb-store", 3, migrate([migration01, migration02, migration03]));

export const resetContent = (db: IDBDatabase, items: FrameSchema[], commitSha: string) =>
  storesTx(db, ["frame", "baseRef"], "readwrite", async (stores) => {
    await Promise.all(stores.map((store) => store.clear()));
    const [frameStore, baseRefStore] = stores;

    items.forEach((item) => frameStore.put(item));
    baseRefStore.add({ sha: commitSha });
  });

export function getRemote(db: IDBDatabase): Promise<RemoteSchema | null> {
  return storesTx(db, ["remote"], "readonly", async ([remoteStore]) => (await remoteStore.getAll())[0] ?? null);
}

export function setRemote(db: IDBDatabase, remote: RemoteSchema): Promise<number> {
  return storesTx(db, ["remote"], "readwrite", async ([remoteStore]) => {
    await remoteStore.clear();
    const key = await remoteStore.add(remote);
    return key as number;
  });
}
