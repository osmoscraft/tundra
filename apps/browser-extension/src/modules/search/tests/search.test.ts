import { commit } from "../../database";
import { createTestDb } from "../../database/tests/fixture";
import { assertEqual } from "../../live-test";
import { searchBacklinkNotes, searchNotes } from "../search";

export async function testBasicSearch() {
  const db = await createTestDb();

  commit(db, {
    path: "data/notes/1.md",
    content: "Hello world",
  });

  const results = searchNotes(db, {
    query: "Hello",
    limit: 10,
  });

  assertEqual(results.length, 1);
  assertEqual(results[0].id, "1");
}

export async function testBacklinkSearch() {
  const db = await createTestDb();

  commit(db, {
    path: "data/notes/1000.md",
    content: "[Hello world](2000)",
  });

  const results = searchBacklinkNotes(db, {
    id: "2000",
    limit: 10,
  });

  assertEqual(results.length, 1);
  assertEqual(results[0].id, "1000");
}
