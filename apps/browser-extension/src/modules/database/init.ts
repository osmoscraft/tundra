import { asyncPipe } from "@tinykb/fp-utils";
import { sqlite3Opfs } from "@tinykb/sqlite-utils";
import { migrate } from "./migrate";
import { migrations } from "./migrations";

export const init = asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/"), (db: Sqlite3.DB) => {
  migrate(migrations, db, {
    onWillMigrate: (from, to) => console.log(`[db] will migrate from v${from} to v${to}`),
    onDidMigrate: (_from, to) => console.log(`[db] did migrate to v${to}`),
  });
  return db;
});
