import CREATE_SCHEMA from "./modules/db/create-schema.sql";
import DELETE_ALL_NODES from "./modules/db/delete-all-nodes.sql";
import MATCH_NODES_BY_TEXT from "./modules/db/match-nodes-by-text.sql";
import SELECT_RECENT_NODES from "./modules/db/select-recent-nodes.sql";
import UPSERT_NODE from "./modules/db/upsert-node.sql";
import initSqlite3 from "./sqlite3/sqlite3.mjs";
import type { FileDownloadReady, MatchNodesReady, MessageToWorker, RecentNodesReady } from "./typings/messages";
import { postMessage } from "./utils/post-message";
declare const self: DedicatedWorkerGlobalScope;

if (!self.crossOriginIsolated) {
  throw new Error("[worker] Disabled: crossOriginIsolated");
}

const dbPromise = initDb();

self.addEventListener("message", async (event: MessageEvent<MessageToWorker>) => {
  console.log(`[worker] received`, event.data);
  const db = await dbPromise;
  switch (event.data?.name) {
    case "request-download": {
      const root = await navigator.storage.getDirectory();
      const dbFileHandle = await await root.getFileHandle("mydb.sqlite3");
      const file = await dbFileHandle.getFile();
      postMessage<FileDownloadReady>(self, { name: "file-download-ready", file });
      break;
    }
    case "request-clear": {
      db.exec(DELETE_ALL_NODES);
      break;
    }
    case "request-reset": {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry("mydb.sqlite3");
      break;
    }
    case "request-recent": {
      const nodes = db.selectObjects(SELECT_RECENT_NODES) as { title: string; url: string }[];
      postMessage<RecentNodesReady>(self, { name: "recent-nodes-ready", nodes });
      break;
    }
    case "request-text-match": {
      const nodes = db.selectObjects(MATCH_NODES_BY_TEXT, {
        ":query": event.data.query,
      }) as { title: string; url: string; html: string }[];
      console.log("matched", nodes);
      postMessage<MatchNodesReady>(self, { name: "match-nodes-ready", nodes });
      break;
    }
    case "request-capture": {
      performance.mark("upsertNodeStart");
      db.exec(UPSERT_NODE, {
        bind: {
          ":id": Date.now().toString(),
          ":url": event.data.url,
          ":target_urls": event.data.target_urls,
          ":title": event.data.title,
        },
      });
      console.log("node upserted", performance.measure("upsertNode", "upsertNodeStart").duration);
      break;
    }
    default:
      const exhausted: never = event.data;
      throw exhausted;
  }
});

async function initDb() {
  console.log("[worker] online");
  const db = await openDb();
  try {
    performance.mark("createSchemaStart");
    db.exec(CREATE_SCHEMA);
    console.log("schema created", performance.measure("createSchema", "createSchemaStart").duration);
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
