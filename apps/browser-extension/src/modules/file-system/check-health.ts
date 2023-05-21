import { destoryOpfsByPath, sqlite3Opfs } from "@tinykb/sqlite-utils";
import { readFile, writeFile } from ".";
import SCHEMA from "./sql/schema.sql";

export async function checkHealth() {
  function assertEqual(expected?: any, actual?: any) {
    if (expected !== actual) {
      throw new Error(`Assert equal filed\nExpeced: ${expected}\nActual: ${actual}`);
    }
  }

  function log(message: string) {
    return console.log("[check health]", message);
  }

  async function test() {
    log("attempt to remove previous test db");
    await destoryOpfsByPath("/tinykb-fs-test.sqlite3")
      .then(() => log("removed"))
      .catch(() => log("nothing to remove"));

    log("init opfs");
    const db = await sqlite3Opfs("./sqlite3/jswasm/", "/tinykb-fs-test.sqlite3");

    log("ensure schema");
    db.exec(SCHEMA);
    log("write file");
    writeFile(db, "/test.md", "text/markdown", "hello world");
    log("file written");

    log("read file");
    const file = readFile(db, "/test.md");
    assertEqual(file?.content, "hello world");
    log("file read");
    log("ok");
  }

  return test()
    .then(() => true)
    .catch(() => false)
    .finally(() => destoryOpfsByPath("/tinykb-fs-test.sqlite3").then(() => log("cleanup")));
}
