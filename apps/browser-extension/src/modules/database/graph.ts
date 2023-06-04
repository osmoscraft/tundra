import type { DbFile, DbNode } from "./schema";
import { arrayToParams, paramsToBindings } from "./utils";

export interface NodeChange {
  path: string;
  title: string;
}
export function setNode(db: Sqlite3.DB, node: NodeChange) {
  const sql = `
INSERT INTO Node VALUES (json(:data))
ON CONFLICT(path) DO UPDATE SET data = json(excluded.data)
`;

  const bind = paramsToBindings(sql, {
    data: JSON.stringify(node),
  });

  db.exec(sql, { bind });
}

export function setNodes(db: Sqlite3.DB, nodes: NodeChange[]) {
  const sql = `
INSERT INTO Node (data) VALUES
${nodes.map((_, i) => /*reduce query size with shortname*/ `(json(:d${i}))`).join(",")}
ON CONFLICT(path) DO UPDATE SET data = json(excluded.data)
    `;

  const bindableNodes = nodes.map((node) => ({ d: JSON.stringify(node) }));
  const bind = paramsToBindings(sql, arrayToParams(bindableNodes));

  return db.exec(sql, { bind });
}

export function getNode(db: Sqlite3.DB, path: string) {
  const sql = `
SELECT * FROM NodeFts WHERE path = :path LIMIT 1
`;

  const bind = paramsToBindings(sql, { path });

  return db.selectObject<DbNode>(sql, bind);
}

export function deleteNode(db: Sqlite3.DB, path: string) {
  // TODO switch to subquery once https://sqlite.org/forum/forumpost/8158967d96 is resolved
  db.transaction(() => {
    const rowids = db.selectValues<number>("SELECT rowid FROM NodeFts WHERE path = :path", {
      ":path": path,
    });

    db.exec(`DELETE FROM Node WHERE rowid IN (${rowids.join(",")})`);
  });
}

export function deleteAllNodes(db: Sqlite3.DB) {
  db.exec("DELETE FROM Node");
}

export interface SearchInput {
  query: string;
  limit: number;
}
export function searchNodes(db: Sqlite3.DB, input: SearchInput) {
  const sql = `
SELECT * FROM NodeFts WHERE title MATCH :query ORDER BY rank LIMIT :limit
`;

  const bind = paramsToBindings(sql, {
    query: input.query,
    limit: input.limit,
  });

  return db.selectObjects<DbNode>(sql, bind);
}

/**
 * @private for testing only
 */
export function searchFiles(db: Sqlite3.DB, input: SearchInput) {
  const sql = `
SELECT * FROM File WHERE path IN (
  SELECT path FROM NodeFts WHERE title MATCH :query ORDER BY rank LIMIT :limit
)
`;

  const bind = paramsToBindings(sql, {
    query: input.query,
    limit: input.limit,
  });

  return db.selectObjects<DbFile>(sql, bind);
}
