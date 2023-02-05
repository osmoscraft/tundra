import type { Sqlite3Db } from "./sqlite";
declare const self: DedicatedWorkerGlobalScope;

const start = async function (sqlite3: any) {
  const log = console.log.bind(console);

  const capi = sqlite3.capi; /*C-style API*/
  const oo = sqlite3.oo1; /*high-level OO API*/
  log("sqlite3 version", capi.sqlite3_libversion(), capi.sqlite3_sourceid());

  let db: Sqlite3Db;
  if (sqlite3.opfs) {
    db = new sqlite3.oo1.OpfsDb("/mydb.sqlite3");
    log("The OPFS is available.");
  } else {
    throw new Error("OPFS is not available");
  }

  try {
    log("Create a table...");
    // db.exec("CREATE TABLE IF NOT EXISTS t(a,b)");
    // log("Insert some data using exec()...");
    // let i;
    // for (i = 20; i <= 25; ++i) {
    //   db.exec({
    //     sql: "INSERT INTO t(a,b) VALUES (?,?)",
    //     bind: [i, i * 2],
    //   });
    // }
    // log("Query data with exec() using rowMode 'array'...");
    // db.exec({
    //   sql: "SELECT a FROM t ORDER BY a LIMIT 10",
    //   rowMode: "array", // 'array' (default), 'object', or 'stmt'
    //   callback: function (row: any) {
    //     log("row =", row);
    //   },
    // });

    const stmt = db.prepare("SELECT a FROM t ORDER BY a LIMIT 10");
    let results: any[] = [];
    stmt.step();
    console.log(stmt.get(results));
    stmt.step();
    console.log(stmt.get(results));
    stmt.step();
    stmt.step();
    stmt.step();
    stmt.finalize();
  } finally {
    db.close();
  }
};

self.addEventListener("message", async (event) => {
  console.log(event);
  // download db
  if (event.data?.name === "request-download") {
    const root = await navigator.storage.getDirectory();
    const dbFileHandle = await await root.getFileHandle("mydb.sqlite3");
    const file = await dbFileHandle.getFile();
    self.postMessage({ name: "file-download-ready", file });
  } else if (event.data?.name === "request-reset") {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry("mydb.sqlite3");
  }
});

async function main() {
  console.log("[worker] online");

  if (self.crossOriginIsolated) {
    importScripts("sqlite3/sqlite3.js");
  } else {
    console.error("[worker] Disabled: crossOriginIsolated");
  }

  (self as any)
    .sqlite3InitModule({
      print: console.log,
      printErr: console.error,
    })
    .then(function (sqlite3: any) {
      console.log("Done initializing. Running demo...");
      try {
        start(sqlite3);
      } catch (e: any) {
        console.error("Exception:", e.message);
      }
    });
}

main();

export default self;
