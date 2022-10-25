import { emit } from "utils";
import { migrate, Migration, openDB, storesTx } from "../utils/idb/idb";

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

export interface GitHubConnection {
  owner: string;
  repo: string;
  token: string;
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

export const dbAsync = openDB("tinky-store", 3, migrate([migration01, migration02, migration03]));

export async function handleDBRequest(e: CustomEvent<{ tid: number; tname: string; targs?: any[]; src: EventTarget }>) {
  const txList = [resetContent, getRemote, setRemote];

  const { tname, targs = [], src } = e.detail;

  const matchedTx = txList.find((item) => item.name === tname);
  const result = await (matchedTx as any)(await dbAsync, ...targs);

  emit(
    "db.respond-tx",
    {
      detail: {
        tid: e.detail.tid,
        result,
      },
    },
    src
  );
}

export const resetContent = (db: IDBDatabase, items: FrameSchema[], commitSha: string) =>
  storesTx(db, ["frame", "baseRef"], "readwrite", async (stores) => {
    await Promise.all(stores.map((store) => store.clear()));
    const [frameStore, baseRefStore] = stores;

    items.forEach((item) => frameStore.put(item));
    baseRefStore.add({ sha: commitSha });
  });

export function getRemote(db: IDBDatabase): Promise<RemoteSchema> {
  return storesTx(db, ["remote"], "readonly", async ([remoteStore]) => (await remoteStore.getAll())[0] ?? null);
}

export function setRemote(db: IDBDatabase, remote: RemoteSchema): Promise<number> {
  return storesTx(db, ["remote"], "readwrite", async ([remoteStore]) => {
    await remoteStore.clear();
    const key = await remoteStore.add(remote);
    return key as number;
  });
}
