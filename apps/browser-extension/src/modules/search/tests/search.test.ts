import { commit } from "../../database";
import SCHEMA from "../../database/schema.sql";
import { createTestDb } from "../../database/tests/fixture";
import { assertEqual } from "../../live-test";
import { searchBacklinkNotes, searchNotes } from "../search";

export async function testBasicSearch() {
  const db = await createTestDb(SCHEMA);

  commit(db, {
    path: "data/notes/1.md",
    content: "Hello world",
  });

  const results = searchNotes(db, {
    query: "Hello",
    limit: 10,
  });

  assertEqual(results.length, 1);
  assertEqual(results[0].path, "data/notes/1.md");
}

export async function testBacklinkSearch() {
  const db = await createTestDb(SCHEMA);

  commit(db, {
    path: "data/notes/1000.md",
    content: "[Hello world](2000)",
  });

  const results = searchBacklinkNotes(db, {
    path: "data/notes/2000.md",
    limit: 10,
  });

  assertEqual(results.length, 1);
  assertEqual(results[0].path, "data/notes/1000.md");
}
