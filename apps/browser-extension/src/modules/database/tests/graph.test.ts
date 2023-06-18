import { assertEqual, assertUndefined } from "../../live-test";
import { deleteAllNodes, deleteNode, getNode, searchNodes, setNode, setNodes } from "../graph";
import SCHEMA from "../schema.sql";
import { createTestDb } from "./fixture";

export async function testGraphCRUD() {
  console.log("[test] graphCRUD");
  const db = await createTestDb(SCHEMA);

  // create
  setNode(db, { path: "/some/path", title: "hello world" });

  let node = getNode(db, "/some/path")!;
  assertEqual(node.title, "hello world", "title");

  // update
  setNode(db, { path: "/some/path", title: "hello world 2" });

  node = getNode(db, "/some/path")!;
  assertEqual(node.title, "hello world 2", "updated title");

  // delete
  deleteNode(db, "/some/path");
  const deleted = getNode(db, "/some/path");
  assertUndefined(deleted, "deleted");

  // bulk insert
  setNodes(db, []); // test empty input

  setNodes(db, [
    { path: "/node-1", title: "node 1" },
    { path: "/node-2", title: "node 2" },
  ]);

  assertEqual(getNode(db, "/node-1")!.title, "node 1", "node 1");
  assertEqual(getNode(db, "/node-2")!.title, "node 2", "node 2");

  // bulk delete
  deleteAllNodes(db);

  assertUndefined(getNode(db, "/node-1"), "node 1");
  assertUndefined(getNode(db, "/node-2"), "node 2");
}

export async function testSearchNodes() {
  console.log("[test] searchNodes");
  const db = await createTestDb(SCHEMA);

  setNodes(db, [
    { path: "/node-1", title: "hello world" },
    { path: "/node-2", title: "OK Computer" },
    { path: "/node-3", title: "random stuff" },
  ]);

  console.log("[test] graphSearch/empty");
  const emptyResults = searchNodes(db, { query: "nothing should show up", limit: 10 });
  assertEqual(emptyResults.length, 0, "No result");

  console.log("[test] graphSearch/simple");
  const simpleResults = searchNodes(db, { query: "hello", limit: 10 });
  assertEqual(simpleResults.length, 1, "Exactly one result");
  assertEqual(simpleResults[0].path, "/node-1", "Path matches");
  assertEqual(simpleResults[0].title, "hello world", "Title matches");

  console.log("[test] graphSearch/caseInsensitive");
  const caseInsensitiveResult = searchNodes(db, { query: "oK comPUtEr", limit: 10 });
  assertEqual(caseInsensitiveResult.length, 1, "Exactly one result");
  assertEqual(caseInsensitiveResult[0].title, "OK Computer", "Title matches");
}
