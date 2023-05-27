import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { sqlite3Opfs } from "@tinykb/sqlite-utils";
import CLEAR_NODES from "./sql/clear-nodes.sql";
import DELETE_NODE from "./sql/delete-node.sql";
import INSERT_NODE from "./sql/insert-node.sql";
import type { DbLastUpdatedTime, DbNode } from "./sql/schema";
import SCHEMA from "./sql/schema.sql";
import SEARCH_NODE from "./sql/search-node.sql";
import SELECT_LAST_UPDATED_TIME from "./sql/select-last-updated-time.sql";
import SELECT_NODE from "./sql/select-node.sql";
export * from "./check-health";
export * from "./update-graph";

export const init = callOnce(
  asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/"), (db: Sqlite3.DB) => {
    db.exec(SCHEMA);
    return db;
  })
);

export function clear(db: Sqlite3.DB) {
  db.exec(CLEAR_NODES);
}

export function searchNode(db: Sqlite3.DB, query: string) {
  return db.selectObjects<DbNode>(SEARCH_NODE, {
    ":query": query,
  });
}

export function getLastUpdatedTime(db: Sqlite3.DB) {
  return db.selectObject<DbLastUpdatedTime>(SELECT_LAST_UPDATED_TIME)?.lastUpdatedTime ?? null;
}

export function updateNode(db: Sqlite3.DB, node: DbNode) {
  // TODO make atomic transcation
  db.exec(DELETE_NODE, {
    bind: {
      ":path": node.path,
    },
  });
  db.exec(INSERT_NODE, {
    bind: {
      ":path": node.path,
      ":data": JSON.stringify({ title: node.title, createdTime: node.createdTime, updatedTime: node.updatedTime }),
    },
  });
}

export function getNode(db: Sqlite3.DB, path: string) {
  return db.selectObject<DbNode>(SELECT_NODE, { ":path": path });
}
