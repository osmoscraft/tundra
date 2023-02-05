import type { Sqlite3Db } from "./typings/sqlite";
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
    db.exec("CREATE TABLE IF NOT EXISTS t(a,b)");
    db.exec({
      sql: "INSERT INTO t(a,b) VALUES (?,?), (?,?)",
      bind: [1, 2, 3, 4],
    });
    console.log(db.selectObjects("SELECT * FROM t ORDER BY a LIMIT 10"));
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
    // assign path to a `const` to prevent bundler from analyzing the import of static assets
    const sqlite3Entry = "./sqlite3/sqlite3.mjs";
    import(sqlite3Entry).then((entry) => entry.default()).then(start);
  } else {
    console.error("[worker] Disabled: crossOriginIsolated");
  }
}

main();

export default self;
