import { destoryOpfsByPath, sqlite3Opfs } from "@tinykb/sqlite-utils";
import { getFileChanges, trackLocalChange, trackRemoteChange } from ".";
import type { TestDataEntry } from "./load-test-data";
import { DbFileChangeSource, DbFileChangeStatus, type DbFileChange } from "./sql/schema";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE_CHANGE from "./sql/select-file-change.sql";
import UPSERT_FILE_CHANGE from "./sql/upsert-file-change.sql";

export async function checkHealth() {
  async function assertFileState(db: Sqlite3.DB, file: TestDataEntry["file"], expected: TestDataEntry["expected"]) {
    db.exec(UPSERT_FILE_CHANGE, {
      bind: {
        ":path": file.path,
        ":localHashTime": file.localHashTime,
        ":remoteHashTime": file.remoteHashTime,
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
    actual?: { source: DbFileChangeSource; status: DbFileChangeStatus },
    expected?: { source: DbFileChangeSource; status: DbFileChangeStatus }
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

  function log(message: any) {
    return console.log("[check health]", message);
  }

  async function test() {
    log("attempt to remove previous test db");
    await destoryOpfsByPath("/tinykb-sync-test.sqlite3")
      .then(() => log(DbFileChangeStatus.Removed))
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
    const changeEntries = await getFileChanges(db);
    testEntries
      .filter((entry) => entry.expected.status !== DbFileChangeStatus.Unchanged)
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
      { source: DbFileChangeSource.Local, status: DbFileChangeStatus.Added }
    );

    await trackRemoteChange(db, "/test/new-local-file", "test");
    assertChange(
      `local added > push`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-local-file",
      }),
      { source: DbFileChangeSource.Remote, status: DbFileChangeStatus.Unchanged }
    );

    await trackLocalChange(db, "/test/new-local-file", "test modified");
    assertChange(
      `local added > push > local modified`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-local-file",
      }),
      { source: DbFileChangeSource.Local, status: DbFileChangeStatus.Modified }
    );

    await trackLocalChange(db, "/test/new-local-file", null);
    assertChange(
      `local added > push > local modified > local removed`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-local-file",
      }),
      { source: DbFileChangeSource.Local, status: DbFileChangeStatus.Removed }
    );

    log(`lifecycle: remote added > pull > remote modified > remote removed`);
    await trackRemoteChange(db, "/test/new-remote-file", "test");
    assertChange(
      `remote added`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-remote-file",
      }),
      { source: DbFileChangeSource.Remote, status: DbFileChangeStatus.Added }
    );

    await trackLocalChange(db, "/test/new-remote-file", "test");
    assertChange(
      `remote added > pull`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-remote-file",
      }),
      { source: DbFileChangeSource.Local, status: DbFileChangeStatus.Unchanged }
    );

    await trackRemoteChange(db, "/test/new-remote-file", "test modified");
    assertChange(
      `remote added > pull > remote modified`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-remote-file",
      }),
      { source: DbFileChangeSource.Remote, status: DbFileChangeStatus.Modified }
    );

    await trackRemoteChange(db, "/test/new-remote-file", null);
    assertChange(
      `remote added > pull > remote modified > remote removed`,
      db.selectObject<DbFileChange>(SELECT_FILE_CHANGE, {
        ":path": "/test/new-remote-file",
      }),
      { source: DbFileChangeSource.Remote, status: DbFileChangeStatus.Removed }
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
