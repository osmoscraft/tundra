import { destoryOpfsByPath, sqlite3Opfs } from "@tinykb/sqlite-utils";
import { clear, getNode, upsertNode } from ".";
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
  }

  async function testCRUD(db: Sqlite3.DB) {
    log("create");
    upsertNode(db, {
      path: "/test/upsert.md",
      title: "title1",
    });

    const node = getNode(db, "/test/upsert.md");
    assertEqual(node?.title, "title1");

    log("update");
    upsertNode(db, {
      path: "/test/upsert.md",
      title: "title1 updated",
    });

    const nodeUpdated = getNode(db, "/test/upsert.md");
    assertEqual(nodeUpdated?.title, "title1 updated");

    log("delete");
    clear(db);
    const nodeDeleted = getNode(db, "/test/upsert.md");
    assertEqual(nodeDeleted, undefined);
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
