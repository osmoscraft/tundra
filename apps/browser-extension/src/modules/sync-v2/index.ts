import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { destoryOpfsByPath, sqlite3Opfs } from "@tinykb/sqlite-utils";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE from "./sql/select-file.sql";
import UPSERT_FILE from "./sql/upsert-file.sql";

export const syncDbAsync = callOnce(
  asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/", "/tinykb-fs.sqlite3"), (db: Sqlite3.DB) => db.exec(SCHEMA))
);

export async function checkSyncHealth() {
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
    db.exec(UPSERT_FILE, {
      bind: {
        ":path": file.path,
        ":localAt": file.localAt,
        ":remoteAt": file.remoteAt,
        ":localHash": file.localHash,
        ":remoteHash": file.remoteHash,
      },
    });

    const actual = db.selectObject<{ source: string; status: string }>(SELECT_FILE, {
      ":path": file.path,
    });

    if (actual?.source !== expected.source) {
      throw new Error(`Assert equal filed: ${file.path}\nExpeced: ${expected.source}\nActual: ${actual?.source}`);
    }

    if (actual?.status !== expected.status) {
      throw new Error(`Assert equal filed: ${file.path}\nExpeced: ${expected.status}\nActual: ${actual?.status}`);
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

    log("test all file states");
    const testEntries = await import("./load-test-data").then((module) => module.getTestDataEntries());
    for (const entry of testEntries) {
      await assertFileState(db, entry.file, entry.expected);
    }
    log(`test ok: ${testEntries.length} files`);
  }

  return test()
    .then(() => true)
    .catch((e) => {
      console.error(e);
      return false;
    })
    .finally(() => destoryOpfsByPath("/tinykb-sync-test.sqlite3").then(() => log("cleanup")));
}
