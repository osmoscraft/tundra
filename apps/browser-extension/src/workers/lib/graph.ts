import Dexie, { Table } from "dexie";

export class Graph extends Dexie {
  node!: Table<DbGraphNode, string>;

  constructor() {
    super("tinykb-graph");
    this.version(1).stores({
      node: "&id, title, timeModified",
    });
  }
}

export interface DbGraphNode {
  id: string;
  title: string;
  timeModified: number;
}
