import CREATE_SCHEMA from "./modules/db/create-schema.sql";
import { download, testConnection } from "./modules/sync/github/operations";
import { getNotifier, getResponder } from "./modules/worker/notify";
import initSqlite3 from "./sqlite3/sqlite3.mjs";
import type { MessageToMainV2, MessageToWorkerV2 } from "./typings/messages";
declare const self: DedicatedWorkerGlobalScope;

if (!self.crossOriginIsolated) {
  throw new Error("[worker] Disabled: crossOriginIsolated");
}

const notifyMain = getNotifier<MessageToMainV2>(self);
const respondMain = getResponder<MessageToMainV2>(self);
const dbPromise = initDb((message) => notifyMain({ log: message }));

self.addEventListener("message", async (message: MessageEvent<MessageToWorkerV2>) => {
  const data = message.data;
  console.log(`[worker] received`, data);

  if (data.requestStatus) {
    notifyMain({ log: "Worker online" });
  }

  if (data.requestGithubConnectionTest) {
    notifyMain({ log: "Testing connection..." });
    const isSuccess = await testConnection(data.requestGithubConnectionTest);
    notifyMain({ log: isSuccess ? "Connection sucessful!" : "Connection failed." });

    respondMain(message.data, { respondGithubConnectionTest: { isSuccess } });
  }

  if (data.requestGithubDownload) {
    notifyMain({ log: "Testing connection..." });

    const db = await dbPromise;
    // TODO load item path and content into DB

    let itemCount = 0;
    const onItem = (path: string, getContent: () => Promise<string>) => {
      notifyMain({ log: `Download item ${++itemCount} ${path}` });
    };

    await download(data.requestGithubDownload, onItem);
  }
});

async function initDb(notify: (message: string) => void) {
  notify("Initializing DB...");
  const db = await openDb();
  try {
    performance.mark("createSchemaStart");
    db.exec(CREATE_SCHEMA);
    console.log("schema created", performance.measure("createSchema", "createSchemaStart").duration);
    notify("DB initialized");
  } finally {
    // TODO evaludation potential memory leak with persisted db conneciton
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

export default self;
