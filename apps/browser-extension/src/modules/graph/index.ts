import { tap } from "@tinykb/fp-utils";
import { initWithSchema, logInitResult } from "@tinykb/sqlite-utils";
import SCHEMA from "./sql/schema.sql";

export class GraphService {
  private db: Promise<Sqlite3.DB>;

  constructor(private opfsPath: string) {
    this.db = initWithSchema(opfsPath, SCHEMA)
      .then(tap(logInitResult.bind(null, opfsPath)))
      .then((result) => result.db);
  }

  upsertNode(node: GraphNode) {}
}

export type IGraphService = Pick<GraphService, keyof GraphService>;

export interface GraphNode {
  id: string;
  data: any;
}
