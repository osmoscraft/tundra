import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { destoryOpfsByPath, sqlite3Opfs } from "@tinykb/sqlite-utils";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE from "./sql/select-file.sql";
import UPSERT_FILE from "./sql/upsert-file.sql";
import UPSERT_LOCAL_CHANGE from "./sql/upsert-local-change.sql";
import UPSERT_REMOTE_CHANGE from "./sql/upsert-remote-change.sql";

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
    log(`test all file states ok: ${testEntries.length} files`);

    log(`lifecycle: local added > push > local modified > local removed`);
    await trackLocalChange(db, "/test/new-local-file", "test");
    assertChange(
      `local added`,
      db.selectObject<{ source: string; status: string }>(SELECT_FILE, {
        ":path": "/test/new-local-file",
      }),
      { source: "local", status: "added" }
    );

    await trackRemoteChange(db, "/test/new-local-file", "test");
    assertChange(
      `local added > push`,
      db.selectObject<{ source: string; status: string }>(SELECT_FILE, {
        ":path": "/test/new-local-file",
      }),
      { source: "remote", status: "unchanged" }
    );

    await trackLocalChange(db, "/test/new-local-file", "test modified");
    assertChange(
      `local added > push > local modified`,
      db.selectObject<{ source: string; status: string }>(SELECT_FILE, {
        ":path": "/test/new-local-file",
      }),
      { source: "local", status: "modified" }
    );

    await trackLocalChange(db, "/test/new-local-file", null);
    assertChange(
      `local added > push > local modified > local removed`,
      db.selectObject<{ source: string; status: string }>(SELECT_FILE, {
        ":path": "/test/new-local-file",
      }),
      { source: "local", status: "removed" }
    );

    log(`lifecycle: remote added > pull > remote modified > remote removed`);
    await trackRemoteChange(db, "/test/new-remote-file", "test");
    assertChange(
      `remote added`,
      db.selectObject<{ source: string; status: string }>(SELECT_FILE, {
        ":path": "/test/new-remote-file",
      }),
      { source: "remote", status: "added" }
    );

    await trackLocalChange(db, "/test/new-remote-file", "test");
    assertChange(
      `remote added > pull`,
      db.selectObject<{ source: string; status: string }>(SELECT_FILE, {
        ":path": "/test/new-remote-file",
      }),
      { source: "local", status: "unchanged" }
    );

    await trackRemoteChange(db, "/test/new-remote-file", "test modified");
    assertChange(
      `remote added > pull > remote modified`,
      db.selectObject<{ source: string; status: string }>(SELECT_FILE, {
        ":path": "/test/new-remote-file",
      }),
      { source: "remote", status: "modified" }
    );

    await trackRemoteChange(db, "/test/new-remote-file", null);
    assertChange(
      `remote added > pull > remote modified > remote removed`,
      db.selectObject<{ source: string; status: string }>(SELECT_FILE, {
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

export async function trackLocalChange(db: Sqlite3.DB, path: string, content: string | null) {
  db.exec(UPSERT_LOCAL_CHANGE, {
    bind: {
      ":path": path,
      ":localHash": content ? await sha1(content) : null,
    },
  });
}

export async function trackRemoteChange(db: Sqlite3.DB, path: string, content: string | null) {
  db.exec(UPSERT_REMOTE_CHANGE, {
    bind: {
      ":path": path,
      ":remoteHash": content ? await sha1(content) : null,
    },
  });
}

async function sha1(input: string) {
  const msgUint8 = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(""); // convert bytes to hex string
  return hashHex;
}
