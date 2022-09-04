import type { IDBPDatabase } from "idb";
import { transact } from "../utils/db";
import { once } from "../utils/once";
import { ChangeStatus, FrameSchema, GraphDBSchema, openGraphDB } from "./db";

export interface GraphConfig {
  db: IDBPDatabase<GraphDBSchema>;
}

export type PutFrameRequest = Pick<FrameSchema, "id" | "body">;

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

  async putFrames(requests: PutFrameRequest[]): Promise<FrameSchema[]> {
    const modifiedFrames = await transact(await this.getDB(), "frame", "readwrite", (tx) => {
      const now = new Date();
      const txStore = tx.objectStore("frame");
      return requests.map((req) => {
        const newFrame = { ...req, header: { dateCreated: now, dateModified: now }, status: ChangeStatus.Update };
        txStore.put(newFrame);
        return newFrame;
      });
    });

    return modifiedFrames;
  }
}
