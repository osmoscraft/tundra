import CREATE_SCHEMA from "./modules/db/create-schema.sql";
import DELETE_ALL_NODES from "./modules/db/delete-all-nodes.sql";
import MATCH_NODES_BY_TEXT from "./modules/db/match-nodes-by-text.sql";
import SELECT_RECENT_NODES from "./modules/db/select-recent-nodes.sql";
import UPSERT_NODE from "./modules/db/upsert-node.sql";
import { download, testConnection } from "./modules/git/github/operations";
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
    case "request-capture": {
      performance.mark("upsertNodeStart");
      db.exec(UPSERT_NODE, {
        bind: {
          ":meta": JSON.stringify({
            id: Date.now().toString(),
            url: event.data.url,
            targetUrls: event.data.targetUrls,
            title: event.data.title,
            modifiedAt: new Date().toISOString(),
          }),
          ":body": "Hello world",
        },
      });
      console.log("node upserted", performance.measure("upsertNode", "upsertNodeStart").duration);
      break;
    }
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
    case "request-clone": {
      const connection = event.data.connection;
      const { oid } = await download(connection, async (path, getContent) => {
        console.log([path, await getContent()]);
        // TODO filter paths to nodes folder, markdown file only
        // TODO split content into frontmatter and body
      });
      console.log(oid);
      // TODO load items into DB, then set head ref to oid
      // Reference: /workspaces/tinykb/experiments/2022-07-30-original-web/src/sync/sync.ts

      break;
    }
    case "request-reset": {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry("mydb.sqlite3");
      break;
    }
    case "request-recent": {
      const nodes = db.selectObjects(SELECT_RECENT_NODES) as { title: string; url: string | null }[];
      postMessage<RecentNodesReady>(self, { name: "recent-nodes-ready", nodes });
      break;
    }
    case "request-test-connection": {
      const connection = event.data.connection;
      testConnection(connection);
      break;
    }
    case "request-text-match": {
      const nodes = db.selectObjects(MATCH_NODES_BY_TEXT, {
        ":query": event.data.query,
      }) as { title: string; url: string | null; html: string }[];
      console.log("matched", nodes);
      postMessage<MatchNodesReady>(self, { name: "match-nodes-ready", nodes });
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
