import { destoryOpfsByPath, sqlite3Opfs } from "@tinykb/sqlite-utils";
import { clear, getNode, searchNode, upsertNode } from ".";
import { assertEqual } from "../live-test";
import SCHEMA from "./sql/schema.sql";

export async function checkHealth() {
  function log(message: string) {
    return console.log("[check health]", message);
  }

  async function runHarness() {
    log("attempt to remove previous test db");
    await destoryOpfsByPath("/tinykb-graph-test.sqlite3")
      .then(() => log("removed"))
      .catch(() => log("nothing to remove"));

    log("init opfs");
    const db = await sqlite3Opfs("./sqlite3/jswasm/", "/tinykb-graph-test.sqlite3");

    log("ensure schema");
    db.exec(SCHEMA);

    await runTests(db);
  }

  async function runTests(db: Sqlite3.DB) {
    await testCRUD(db);
    await testFTS(db);
  }

  async function testCRUD(db: Sqlite3.DB) {
    log("create");
    upsertNode(db, {
      path: "/test/upsert.md",
      title: "title1",
      createdTime: "2021-01-01T00:00:00.000Z",
      updatedTime: "2021-01-01T00:00:00.000Z",
    });

    const node = getNode(db, "/test/upsert.md");
    assertEqual(node?.title, "title1");

    log("update");
    upsertNode(db, {
      path: "/test/upsert.md",
      title: "title1 updated",
      createdTime: "2021-01-01T00:00:00.000Z",
      updatedTime: "2021-01-02T00:00:00.000Z",
    });

    const nodeUpdated = getNode(db, "/test/upsert.md");
    assertEqual(nodeUpdated?.title, "title1 updated");

    log("delete");
    clear(db);
    const nodeDeleted = getNode(db, "/test/upsert.md");
    assertEqual(nodeDeleted, undefined);
  }

  async function testFTS(db: Sqlite3.DB) {
    log("insert search targets");
    upsertNode(db, {
      path: "/test/search-1.md",
      title: "hello world",
      createdTime: "2021-01-01T00:00:00.000Z",
      updatedTime: "2021-01-01T00:00:00.000Z",
    });
    upsertNode(db, {
      path: "/test/search-2.md",
      title: "OK Computer",
      createdTime: "2021-01-01T00:00:00.000Z",
      updatedTime: "2021-01-01T00:00:00.000Z",
    });
    upsertNode(db, {
      path: "/test/search-3.md",
      title: "random stuff",
      createdTime: "2021-01-01T00:00:00.000Z",
      updatedTime: "2021-01-01T00:00:00.000Z",
    });

    log("empty");
    const emptyResults = searchNode(db, "nothing should show up");
    assertEqual(emptyResults.length, 0, "No result");

    log("simple search");
    const simpleResults = searchNode(db, "hello");
    assertEqual(simpleResults.length, 1, "Exactly one result");
    assertEqual(simpleResults[0].path, "/test/search-1.md", "Path matches");
    assertEqual(simpleResults[0].title, "hello world", "Title matches");

    log("case insensitive");
    const caseInsensitiveResult = searchNode(db, "oK comPUtEr");
    assertEqual(caseInsensitiveResult.length, 1, "Exactly one result");
    assertEqual(caseInsensitiveResult[0].title, "OK Computer", "Title matches");
  }

  return runHarness()
    .then(() => {
      log("OK");
      return true;
    })
    .catch((e) => {
      console.error(e);
      return false;
    })
    .finally(() => destoryOpfsByPath("/tinykb-graph-test.sqlite3").then(() => log("cleanup")));
}
