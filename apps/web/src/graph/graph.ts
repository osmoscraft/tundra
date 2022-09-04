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
    putFrames: async (frames: PutFrameRequest[]) => {
      const changedFrames = await putFrames(config.db, frames);
      config.events.dispatchEvent(new CustomEvent("updated", { detail: changedFrames }));
    },
    resetFrames: async (requests: HardResetFrameRequest[]) => {
      const frames = await resetFrames(config.db, requests);
      config.events.dispatchEvent(new CustomEvent("reset", { detail: frames }));
    },
  };
}

async function getFrames(store: IDBPDatabase<AppStoreSchema>, ids: string[]): Promise<FrameSchema[]> {
  const tx = store.transaction("frame", "readonly");
  const txStore = tx.objectStore("frame");
  const frames = ids.map((id) => txStore.get(id)).filter(async (frame) => await frame) as Promise<FrameSchema>[];
  await tx.done;
  return Promise.all(frames);
}

async function getAllFrames(store: IDBPDatabase<AppStoreSchema>): Promise<FrameSchema[]> {
  return store.getAll("frame");
}

export type PutFrameRequest = Pick<FrameSchema, "id" | "body">;
async function putFrames(store: IDBPDatabase<AppStoreSchema>, requests: PutFrameRequest[]): Promise<FrameSchema[]> {
  const tx = store.transaction("frame", "readwrite");
  const now = new Date();
  const txStore = tx.objectStore("frame");
  const changedFrames = requests.map((req) => {
    const newFrame = { ...req, header: { dateCreated: now, dateModified: now }, status: ChangeStatus.Update };
    txStore.put(newFrame);
    return newFrame;
  });
  await tx.done;

  return changedFrames;
}

export type HardResetFrameRequest = Pick<FrameSchema, "id" | "body" | "header">;
async function resetFrames(store: IDBPDatabase<AppStoreSchema>, requests: HardResetFrameRequest[]): Promise<FrameSchema[]> {
  const tx = store.transaction(["frame"], "readwrite");
  tx.objectStore("frame").clear();

  const txStore = tx.objectStore("frame");
  const changedFrames = requests.map((req) => {
    const newFrame = { ...req, header: req.header, status: ChangeStatus.Clean };
    txStore.add(newFrame);
    return newFrame;
  });
  await tx.done;

  return changedFrames;
}
