import type { IDBPDatabase } from "idb";
import { AppStoreSchema, ChangeStatus, FrameSchema } from "./db";

export interface GraphConfig {
  events: EventTarget;
  db: IDBPDatabase<AppStoreSchema>;
}

export function getGraph(config: GraphConfig) {
  return {
    getFrames: getFrames.bind(null, config.db),
    getAllFrames: getAllFrames.bind(null, config.db),
    putFrames: async (files: PutFileRequest[]) => {
      const changedFiles = await putFrames(config.db, files);
      config.events.dispatchEvent(new CustomEvent("updated", { detail: changedFiles }));
    },
    resetFrames: async (files: HardResetFileRequest[]) => {
      const resetFiles = await resetFrames(config.db, files);
      config.events.dispatchEvent(new CustomEvent("reset", { detail: resetFiles }));
    },
  };
}

async function getFrames(store: IDBPDatabase<AppStoreSchema>, ids: string[]): Promise<FrameSchema[]> {
  const tx = store.transaction("frame", "readonly");
  const txStore = tx.objectStore("frame");
  const files = ids.map((id) => txStore.get(id)).filter(async (file) => await file) as Promise<FrameSchema>[];
  await tx.done;
  return Promise.all(files);
}

async function getAllFrames(store: IDBPDatabase<AppStoreSchema>): Promise<FrameSchema[]> {
  return store.getAll("frame");
}

export type PutFileRequest = Pick<FrameSchema, "id" | "body">;
async function putFrames(store: IDBPDatabase<AppStoreSchema>, requests: PutFileRequest[]): Promise<FrameSchema[]> {
  const tx = store.transaction("frame", "readwrite");
  const now = new Date();
  const txStore = tx.objectStore("frame");
  const changedFiles = requests.map((req) => {
    const newFile = { ...req, header: { dateCreated: now, dateModified: now }, status: ChangeStatus.Update };
    txStore.put(newFile);
    return newFile;
  });
  await tx.done;

  return changedFiles;
}

export type HardResetFileRequest = Pick<FrameSchema, "id" | "body" | "header">;
async function resetFrames(store: IDBPDatabase<AppStoreSchema>, requests: HardResetFileRequest[]): Promise<FrameSchema[]> {
  const tx = store.transaction(["frame"], "readwrite");
  tx.objectStore("frame").clear();

  const txStore = tx.objectStore("frame");
  const changedFiles = requests.map((req) => {
    const newFile = { ...req, header: req.header, status: ChangeStatus.Clean };
    txStore.add(newFile);
    return newFile;
  });
  await tx.done;

  return changedFiles;
}
