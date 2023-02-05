import CREATE_SCHEMA from "./modules/db/create-schema.sql";
import UPSERT_SAMPLE_DATA from "./modules/db/upsert-sample-data.sql";
import initSqlite3 from "./sqlite3/sqlite3.mjs";
declare const self: DedicatedWorkerGlobalScope;

if (!self.crossOriginIsolated) {
  throw new Error("[worker] Disabled: crossOriginIsolated");
}

const dbPromise = initSqlite3().then((sqlite3) => {
  if (!sqlite3.opfs) throw new Error("OPFS is not loaded");
  console.debug("sqlite3 version", sqlite3.capi.sqlite3_libversion(), sqlite3.capi.sqlite3_sourceid());
  return new sqlite3.oo1.OpfsDb("/mydb.sqlite3");
});

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
  const db = await dbPromise;

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
}

main();

export default self;
