import { destoryOpfsByPath, sqlite3Opfs } from "@tinykb/sqlite-utils";
import { clear, queryFiles, readFile, writeFile } from ".";
import { assertDeepEqual, assertEqual } from "../live-test";
import SCHEMA from "./sql/schema.sql";

export async function checkHealth() {
  function log(message: string) {
    return console.log("[check health]", message);
  }

  async function runHarness() {
    log("attempt to remove previous test db");
    await destoryOpfsByPath("/tinykb-fs-test.sqlite3")
      .then(() => log("removed"))
      .catch(() => log("nothing to remove"));

    log("init opfs");
    const db = await sqlite3Opfs("./sqlite3/jswasm/", "/tinykb-fs-test.sqlite3");

    log("ensure schema");
    db.exec(SCHEMA);

    await runTests(db);
  }

  async function testRW(db: Sqlite3.DB) {
    log("write file");
    writeFile(db, "/test.md", "hello world");
    log("file written");

    log("read file");
    const file = readFile(db, "/test.md");
    assertEqual(file?.content, "hello world");

    clear(db);
    const fileDeleted = readFile(db, "/test.md");
    assertEqual(fileDeleted, undefined);
  }

  async function testTimestamp(db: Sqlite3.DB) {
    log("write timestamp files");
    writeFile(db, "/test-1.md", "hello world");
    await new Promise((resolve) => setTimeout(resolve, 2));
    writeFile(db, "/test-2.md", "hello world");
    await new Promise((resolve) => setTimeout(resolve, 2));
    writeFile(db, "/test-3.md", "hello world");

    const test2 = readFile(db, "/test-2.md");
    const newerFiles = queryFiles(db, { minUpdatedTime: test2!.updatedTime }).map((file) => file.path);
    assertDeepEqual(newerFiles, ["/test-3.md"]);
  }

  async function runTests(db: Sqlite3.DB) {
    await testRW(db);
    await testTimestamp(db);
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
    .finally(() => destoryOpfsByPath("/tinykb-fs-test.sqlite3").then(() => log("cleanup")));
}
