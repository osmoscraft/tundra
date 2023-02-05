import CREATE_SCHEMA from "./modules/db/create-schema.sql";
import UPSERT_NODE from "./modules/db/upsert-node.sql";
import UPSERT_SAMPLE_DATA from "./modules/db/upsert-sample-data.sql";
import initSqlite3 from "./sqlite3/sqlite3.mjs";
declare const self: DedicatedWorkerGlobalScope;

if (!self.crossOriginIsolated) {
  throw new Error("[worker] Disabled: crossOriginIsolated");
}

const openDb = () =>
  initSqlite3().then((sqlite3) => {
    if (!sqlite3.opfs) throw new Error("OPFS is not loaded");
    console.debug("sqlite3 version", sqlite3.capi.sqlite3_libversion(), sqlite3.capi.sqlite3_sourceid());
    return new sqlite3.oo1.OpfsDb("/mydb.sqlite3");
  });

self.addEventListener("message", async (event) => {
  switch (event.data?.name) {
    case "request-download": {
      const root = await navigator.storage.getDirectory();
      const dbFileHandle = await await root.getFileHandle("mydb.sqlite3");
      const file = await dbFileHandle.getFile();
      self.postMessage({ name: "file-download-ready", file });
      break;
    }
    case "request-reset": {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry("mydb.sqlite3");
      break;
    }
    case "request-capture": {
      const db = await openDb();
      try {
        db.exec(UPSERT_NODE, {
          bind: {
            ":id": Date.now().toString(),
            ":urls": event.data.urls,
            ":target_urls": event.data.target_urls,
            ":title": event.data.title,
          },
        });
      } finally {
        db.close();
      }
    }
  }
});

async function main() {
  console.log("[worker] online");
  const db = await openDb();

  try {
    performance.mark("createSchemaStart");
    db.exec(CREATE_SCHEMA);
    console.log("schema created", performance.measure("createSchema", "createSchemaStart").duration);

    performance.mark("upsertSampleDataStart");
    db.exec(UPSERT_SAMPLE_DATA);
    console.log("sample inserted", performance.measure("upsertSampleData", "upsertSampleDataStart").duration);
  } finally {
    db.close();
  }
}

main();

export default self;
