import type { IDBPDatabase } from "idb";
import { transact } from "../utils/db";
import { ensure } from "../utils/flow-control";
import { once } from "../utils/once";
import { ChangeStatus, FrameSchema, GraphDBSchema, openGraphDB } from "./db";

export interface GraphConfig {
  db: IDBPDatabase<GraphDBSchema>;
}

export type CreateFrameRequest = Pick<FrameSchema, "body">;
export type UpdateFrameRequest = Pick<FrameSchema, "id" | "body">;

export class GraphModule extends EventTarget {
  private getDB = once(openGraphDB);

  async getFrames(ids: string[]): Promise<FrameSchema[]> {
    return transact(await this.getDB(), "frame", "readonly", (tx) => {
      const txStore = tx.objectStore("frame");
      const framesAsync = ids.map((id) => txStore.get(id)).filter(async (frame) => await frame) as Promise<FrameSchema>[];
      return Promise.all(framesAsync);
    });
  }

  async getAllFrames(): Promise<FrameSchema[]> {
    return (await this.getDB()).getAll("frame");
  }

  async createFrames(requests: CreateFrameRequest[]): Promise<FrameSchema[]> {
    const now = new Date();
    const frames = requests.map((req) => ({ ...req, id: this.getNewId(), header: { dateCreated: now, dateModified: now }, status: ChangeStatus.Create }));

    await transact(await this.getDB(), "frame", "readwrite", (tx) => frames.map((frame) => tx.objectStore("frame").add(frame)));

    return frames;
  }

  async updateFrames(requests: UpdateFrameRequest[]): Promise<FrameSchema[]> {
    const now = new Date();

    const framesAsync = await transact(await this.getDB(), "frame", "readwrite", (tx) => {
      return requests.map(async (req) => {
        const store = tx.objectStore("frame");
        const existing = ensure(await store.get(req.id));
        const frame = {
          ...existing,
          ...req,
          header: { dateCreated: existing.header.dateCreated, dateModified: now },
          status: ChangeStatus.Update,
        };

        store.put(frame);
        return frame;
      });
    });

    return Promise.all(framesAsync);
  }

  private getNewId() {
    return crypto.randomUUID();
  }
}
