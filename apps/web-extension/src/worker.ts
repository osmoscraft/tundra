import CREATE_SCHEMA from "./modules/db/create-schema.sql";
import UPSERT_SAMPLE_DATA from "./modules/db/upsert-sample-data.sql";
import type { Sqlite3Db } from "./typings/sqlite";
declare const self: DedicatedWorkerGlobalScope;

const start = async function (sqlite3: any) {
  performance.mark("inner start");
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
    performance.mark("t3");
    db.exec(CREATE_SCHEMA);
    console.log("schema created", performance.measure("d", "t3").duration);

    performance.mark("t4");
    db.exec(UPSERT_SAMPLE_DATA);
    console.log("sample inserted", performance.measure("d", "t4").duration);
  } finally {
    db.close();
  }
  console.log(performance.measure("d", "inner start").duration);
  console.log(performance.measure("d", "start").duration);
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
  performance.mark("start");

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
