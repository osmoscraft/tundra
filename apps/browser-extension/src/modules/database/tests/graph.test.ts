import { searchNode } from "../../graph";
import { assertEqual, assertUndefined } from "../../live-test";
import { deleteNode, getNode, setNode, setNodes } from "../graph";
import SCHEMA from "../schema.sql";
import { createTestDb } from "./fixture";

export async function testGraphCRUD() {
  console.log("[test] graphCRUD");
  const db = await createTestDb(SCHEMA);

  setNode(db, { path: "/some/path", title: "hello world" });

  let node = getNode(db, "/some/path")!;
  assertEqual(node.title, "hello world", "title");

  setNode(db, { path: "/some/path", title: "hello world 2" });

  node = getNode(db, "/some/path")!;
  assertEqual(node.title, "hello world 2", "updated title");

  deleteNode(db, "/some/path");
  const deleted = getNode(db, "/some/path");
  assertUndefined(deleted, "deleted");
}

export async function testGraphSearch() {
  console.log("[test] graphSearch");
  const db = await createTestDb(SCHEMA);

  setNodes(db, [
    { path: "/node-1", title: "hello world" },
    { path: "/node-2", title: "OK Computer" },
    { path: "/node-3", title: "random stuff" },
  ]);

  console.log("[test] graphSearch/empty");
  const emptyResults = searchNode(db, "nothing should show up");
  assertEqual(emptyResults.length, 0, "No result");

  console.log("[test] graphSearch/simple");
  const simpleResults = searchNode(db, "hello");
  assertEqual(simpleResults.length, 1, "Exactly one result");
  assertEqual(simpleResults[0].path, "/node-1", "Path matches");
  assertEqual(simpleResults[0].title, "hello world", "Title matches");

  console.log("[test] graphSearch/caseInsensitive");
  const caseInsensitiveResult = searchNode(db, "oK comPUtEr");
  assertEqual(caseInsensitiveResult.length, 1, "Exactly one result");
  assertEqual(caseInsensitiveResult[0].title, "OK Computer", "Title matches");
}
