import initSqlite3 from "./sqlite3/sqlite3.mjs"; // external, relative to worker script
import CREATE_SCHEMA from "./statements/create-schema.sql";

export async function initDb(log: (message: string) => void) {
  log("Initializing DB...");
  const db = await openDb();
  try {
    performance.mark("createSchemaStart");
    db.exec(CREATE_SCHEMA);
    console.log("schema created", performance.measure("createSchema", "createSchemaStart").duration);
    log("DB initialized");
  } finally {
    // TODO evaludation potential memory leak with persisted db conneciton
    // Unclear when we must call
    // db.close();
  }

  return db;
}

function openDb() {
  return initSqlite3().then((sqlite3) => {
    if (!sqlite3.opfs) throw new Error("OPFS is not loaded");
    console.debug("sqlite3 version", sqlite3.capi.sqlite3_libversion(), sqlite3.capi.sqlite3_sourceid());
    return new sqlite3.oo1.OpfsDb("/mydb.sqlite3");
  });
}
