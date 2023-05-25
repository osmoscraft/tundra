import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { sqlite3Opfs } from "@tinykb/sqlite-utils";
import CLEAR_NODES from "./sql/clear-nodes.sql";
import DELETE_NODE from "./sql/delete-node.sql";
import INSERT_NODE from "./sql/insert-node.sql";
import type { DbNode } from "./sql/schema";
import SCHEMA from "./sql/schema.sql";
import SELECT_NODE from "./sql/select-node.sql";
export * from "./check-health";

export const init = callOnce(
  asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/"), (db: Sqlite3.DB) => {
    db.exec(SCHEMA);
    return db;
  })
);

export function clear(db: Sqlite3.DB) {
  db.exec(CLEAR_NODES);
}

export function upsertNode(db: Sqlite3.DB, node: DbNode) {
  db.exec(DELETE_NODE, {
    bind: {
      ":path": node.path,
    },
  });
  db.exec(INSERT_NODE, {
    bind: {
      ":path": node.path,
      ":data": JSON.stringify({ title: node.title }),
    },
  });
}

export function getNode(db: Sqlite3.DB, path: string) {
  return db.selectObject<DbNode>(SELECT_NODE, { ":path": path });
}
