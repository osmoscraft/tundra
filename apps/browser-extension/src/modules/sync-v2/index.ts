import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { sqlite3Opfs } from "@tinykb/sqlite-utils";
import CLEAR_CONFIG from "./sql/clear-config.sql";
import CLEAR_HISTORY from "./sql/clear-history.sql";
import SCHEMA from "./sql/schema.sql";
import UPSERT_LOCAL_CHANGE from "./sql/upsert-local-change.sql";
import UPSERT_REMOTE_CHANGE from "./sql/upsert-remote-change.sql";

export * from "./check-health";

export const init = callOnce(
  asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/"), (db: Sqlite3.DB) => db.exec(SCHEMA))
);

export function clearConfig(db: Sqlite3.DB) {
  return db.exec(CLEAR_CONFIG);
}

export function clearHistory(db: Sqlite3.DB) {
  return db.exec(CLEAR_HISTORY);
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
