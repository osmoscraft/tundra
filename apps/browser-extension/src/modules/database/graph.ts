import type { DbNode } from "./schema";
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
  if (!nodes.length) return;

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
  const sql = `
  DELETE FROM Node WHERE rowid IN (
    SELECT rowid FROM NodeFts WHERE path = :path
  )`;
  const bind = paramsToBindings(sql, { path });

  return db.exec(sql, { bind });
}

export function deleteAllNodes(db: Sqlite3.DB) {
  db.exec("DELETE FROM Node");
}

export interface SearchNodesInput {
  query: string;
  limit: number;
}
export function searchNodes(db: Sqlite3.DB, input: SearchNodesInput) {
  const sql = `
SELECT * FROM NodeFts WHERE title MATCH :query ORDER BY rank LIMIT :limit
`;

  const bind = paramsToBindings(sql, {
    query: input.query,
    limit: input.limit,
  });

  return db.selectObjects<DbNode>(sql, bind);
}
