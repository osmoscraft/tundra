import CREATE_SCHEMA from "./modules/db/create-schema.sql";
import DELETE_ALL_NODES from "./modules/db/delete-all-nodes.sql";
import GET_REF from "./modules/db/get-ref.sql";
import INSERT_NODE from "./modules/db/insert-node.sql";
import MATCH_NODES_BY_TEXT from "./modules/db/match-nodes-by-text.sql";
import MATCH_NODES_BY_URL from "./modules/db/match-nodes-by-url.sql";
import SELECT_CHANGED_NODES from "./modules/db/select-changed-nodes.sql";
import SELECT_RECENT_NODES from "./modules/db/select-recent-nodes.sql";
import SET_REF from "./modules/db/set-ref.sql";
import { download, getRemoteHeadRef, testConnection } from "./modules/git/github/operations";
import { splitByFence } from "./modules/markdown/fence";
import initSqlite3 from "./sqlite3/sqlite3.mjs";
import type {
  MessageToWorker,
  RespondActiveTabMatch,
  RespondFileDownload,
  RespondMatchNodes,
  RespondRecentNodes,
} from "./typings/messages";
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
    case "request-active-tab-match": {
      const matchedNodes = db.selectObjects(MATCH_NODES_BY_URL, { ":url": event.data.url }) as {
        body: string;
        title: string;
        targetUrls: string[];
        url: string | null;
      }[];
      postMessage<RespondActiveTabMatch>(self, { name: "respond-active-tab-match", nodes: matchedNodes });
      break;
    }
    case "request-capture": {
      performance.mark("upsertNodeStart");
      db.exec(INSERT_NODE, {
        bind: {
          ":meta": JSON.stringify({
            id: Date.now().toString(),
            url: event.data.url,
            targetUrls: event.data.targetUrls,
            title: event.data.title,
            modifiedAt: new Date().toISOString(),
          }),
          ":body": event.data.body,
          ":change": "created",
        },
      });
      console.log("node upserted", performance.measure("upsertNode", "upsertNodeStart").duration);
      break;
    }
    case "request-download": {
      const root = await navigator.storage.getDirectory();
      const dbFileHandle = await await root.getFileHandle("mydb.sqlite3");
      const file = await dbFileHandle.getFile();
      postMessage<RespondFileDownload>(self, { name: "respond-file-download", file });
      break;
    }
    case "request-clear": {
      db.exec(DELETE_ALL_NODES);
      break;
    }
    case "request-clone": {
      const connection = event.data.connection;

      db.exec(DELETE_ALL_NODES);

      const { oid } = await download(connection, async (path, getContent) => {
        // TODO filter paths to nodes folder, markdown file only
        if (!path.includes("/nodes/") || !path.endsWith(".md")) return;
        const [header, body] = splitByFence(await getContent());
        const meta = JSON.parse(header);
        console.log([meta, body]);

        db.exec(INSERT_NODE, {
          bind: {
            ":meta": JSON.stringify({
              id: meta.id,
              title: meta.title,
              modifiedAt: meta.modifiedAt,
            }),
            ":body": body,
          },
        });
      });

      db.exec(SET_REF, {
        bind: { ":type": "head", ":id": oid },
      });

      break;
    }
    case "request-push": {
      const changedNodes = db.selectObjects(SELECT_CHANGED_NODES);
      console.log("local changed nodes:", changedNodes);
      // TODO create commit and update remote ref
    }
    case "request-reset": {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry("mydb.sqlite3");
      break;
    }
    case "request-recent": {
      const nodes = db.selectObjects(SELECT_RECENT_NODES) as { title: string; url: string | null }[];
      postMessage<RespondRecentNodes>(self, { name: "respond-recent-nodes", nodes });
      break;
    }
    case "request-sync": {
      const localHeadRef = db.selectObject(GET_REF, { ":type": "head" })?.id;

      const connection = event.data.connection;
      const remoteHeadRef = await getRemoteHeadRef(connection);

      console.log("[localRef, remoteRef]:", [localHeadRef, remoteHeadRef]);
      if (localHeadRef === remoteHeadRef) return;

      // get the difference between local and remote and apply to DB

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
      postMessage<RespondMatchNodes>(self, { name: "respond-match-nodes", nodes });
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
