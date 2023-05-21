import { destoryOpfsByPath, sqlite3Opfs } from "@tinykb/sqlite-utils";
import { getChangedFiles, trackLocalChange, trackRemoteChange } from ".";
import type { DbFileChange } from "./sql/schema";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE_CHANGE from "./sql/select-file-change.sql";
import UPSERT_FILE_CHANGE from "./sql/upsert-file-change.sql";

export async function checkHealth() {
  async function assertFileState(
    db: Sqlite3.DB,
    file: {
      path: string;
      localAt: string | null;
      remoteAt: string | null;
      localHash: string | null;
      remoteHash: string | null;
    },
    expected: {
      source: string;
      status: string;
    }
  ) {
    db.exec(UPSERT_FILE_CHANGE, {
      bind: {
        ":path": file.path,
        ":localAt": file.localAt,
        ":remoteAt": file.remoteAt,
        ":localHash": file.localHash,
        ":remoteHash": file.remoteHash,
      },
    });

    const actual = db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
      ":path": file.path,
    });

    assertChange(file.path, actual, expected);
  }

  function assertChange(
    message: string,
    actual?: { source: string; status: string },
    expected?: { source: string; status: string }
  ) {
    assertStrictEqual(actual?.source, expected?.source, message);
    assertStrictEqual(actual?.status, expected?.status, message);
  }

  function assertStrictEqual(actual: any, expected: any, message: string) {
    if (actual !== expected) {
      throw new Error(`Assert strict equal failed: ${message}\nExpeced: ${expected}\nActual: ${actual}`);
    }
  }

  function assertDefined(actual: any, message: string) {
    if (typeof actual === "undefined") {
      throw new Error(`Assert defined failed: ${message}`);
    }
  }

  function log(message: string) {
    return console.log("[check health]", message);
  }

  async function test() {
    log("attempt to remove previous test db");
    await destoryOpfsByPath("/tinykb-sync-test.sqlite3")
      .then(() => log("removed"))
      .catch(() => log("nothing to remove"));

    log("init opfs");
    const db = await sqlite3Opfs("./sqlite3/jswasm/", "/tinykb-sync-test.sqlite3");

    log("ensure schema");
    db.exec(SCHEMA);

    log("test single file states");
    const testEntries = await import("./load-test-data").then((module) => module.getSingleFileTestEntries());
    for (const entry of testEntries) {
      await assertFileState(db, entry.file, entry.expected);
      log(`single file state ok: ${entry.file.path}`);
    }

    log("test changed files");
    const changeEntries = await getChangedFiles(db);
    testEntries
      .filter((entry) => entry.expected.status !== "unchanged")
      .forEach((entry) => {
        const matchedChangeEntry = changeEntries.find((change) => change.path === entry.file.path);
        assertDefined(matchedChangeEntry, `change entry not found: ${entry.file.path}`);
        assertStrictEqual(
          matchedChangeEntry?.source,
          entry.expected.source,
          `change entry source not matched: ${entry.file.path}`
        );
        assertStrictEqual(
          matchedChangeEntry?.status,
          entry.expected.status,
          `change entry status not matched: ${entry.file.path}`
        );
      });

    log(`test change files ok: ${changeEntries.length} files`);

    log(`lifecycle: local added > push > local modified > local removed`);
    await trackLocalChange(db, "/test/new-local-file", "test");
    assertChange(
      `local added`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-local-file",
      }),
      { source: "local", status: "added" }
    );

    await trackRemoteChange(db, "/test/new-local-file", "test");
    assertChange(
      `local added > push`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-local-file",
      }),
      { source: "remote", status: "unchanged" }
    );

    await trackLocalChange(db, "/test/new-local-file", "test modified");
    assertChange(
      `local added > push > local modified`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-local-file",
      }),
      { source: "local", status: "modified" }
    );

    await trackLocalChange(db, "/test/new-local-file", null);
    assertChange(
      `local added > push > local modified > local removed`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-local-file",
      }),
      { source: "local", status: "removed" }
    );

    log(`lifecycle: remote added > pull > remote modified > remote removed`);
    await trackRemoteChange(db, "/test/new-remote-file", "test");
    assertChange(
      `remote added`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-remote-file",
      }),
      { source: "remote", status: "added" }
    );

    await trackLocalChange(db, "/test/new-remote-file", "test");
    assertChange(
      `remote added > pull`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-remote-file",
      }),
      { source: "local", status: "unchanged" }
    );

    await trackRemoteChange(db, "/test/new-remote-file", "test modified");
    assertChange(
      `remote added > pull > remote modified`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-remote-file",
      }),
      { source: "remote", status: "modified" }
    );

    await trackRemoteChange(db, "/test/new-remote-file", null);
    assertChange(
      `remote added > pull > remote modified > remote removed`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-remote-file",
      }),
      { source: "remote", status: "removed" }
    );
  }

  return test()
    .then(() => true)
    .catch((e) => {
      console.error(e);
      return false;
    })
    .finally(() => destoryOpfsByPath("/tinykb-sync-test.sqlite3").then(() => log("cleanup")));
}
