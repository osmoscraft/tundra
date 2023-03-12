import { getDbFile, initDb } from "./modules/db/init";
import { ChangeType, download, DraftNode, testConnection, updateContent } from "./modules/sync/github/operations";
import { getNotifier, getResponder } from "./modules/worker/notify";

import DELETE_ALL_NODES from "./modules/db/statements/delete-all-nodes.sql";
import INSERT_NODE from "./modules/db/statements/insert-node.sql";
import MATCH_NODES_BY_TEXT from "./modules/db/statements/match-nodes-by-text.sql";
import SELECT_NODE_BY_PATH from "./modules/db/statements/select-node-by-path.sql";
import SET_REF from "./modules/db/statements/set-ref.sql";

import { destoryDb } from "./modules/db/init";
import { internalQuery } from "./modules/search/get-query";
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

  if (data.requestCapture) {
    const draft: DraftNode = {
      path: `nodes/${Date.now().toString()}.json`,
      content: JSON.stringify(data.requestCapture.data!, null, 2),
      changeType: ChangeType.Create,
    };

    // TODO try github repository content API to further reduce network traffic
    // const result = await pushBulk(data.requestCapture!.githubConnection, [draft]);
    const pushResult = await updateContent(data.requestCapture!.githubConnection, {
      path: `nodes/${Date.now().toString()}.json`,
      content: JSON.stringify(data.requestCapture.data!, null, 2),
    });

    // TODO sync with remote

    console.log("pushed", pushResult);
    respondMain(data, { respondCapture: pushResult.commit.sha });

    // TODO pull latest to DB
  }

  if (data.requestDbClear) {
    const db = await dbPromise;
    db.exec(DELETE_ALL_NODES);
    notifyMain({ log: "DB cleared." });
  }

  if (data.requestDbDownload) {
    const file = await getDbFile();
    respondMain(data, { respondDbDownload: file });
  }

  if (data.requestDbNodesByPaths) {
    const db = await dbPromise;
    const results = data.requestDbNodesByPaths
      .flatMap((path) =>
        db.selectObjects<{ path: string; content: any }>(SELECT_NODE_BY_PATH, {
          ":path": path,
        })
      )
      .filter((rawNode) => rawNode.path.endsWith(".json"))
      .map((rawNode) => ({
        path: rawNode.path,
        content: JSON.parse(rawNode.content),
      }));

    respondMain(data, {
      respondDbNodesByPaths: results,
    });
  }

  if (data.requestDbSearch) {
    const db = await dbPromise;
    const normalizedQuery = internalQuery(data.requestDbSearch.query);
    const nodes = (
      db.selectObjects(MATCH_NODES_BY_TEXT, {
        ":query": normalizedQuery,
      }) as { path: string; content: string }[]
    )
      .filter((rawNode) => rawNode.path.endsWith(".json"))
      .map((rawNode) => ({
        path: rawNode.path,
        content: JSON.parse(rawNode.content),
      }));
    respondMain(data, { respondDbSearch: nodes });
  }

  if (data.requestDbNuke) {
    await destoryDb();
    notifyMain({ log: "DB nuked." });
  }

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

    db.exec(DELETE_ALL_NODES);

    let itemCount = 0;
    const onItem = async (path: string, getContent: () => Promise<string>) => {
      notifyMain({ log: `Download item ${++itemCount} ${path}` });

      db.exec(INSERT_NODE, {
        bind: {
          ":path": path.slice(path.indexOf("/") + 1),
          ":content": await getContent(),
        },
      });
    };

    const onComplete = (commitSha: string) => {
      db.exec(SET_REF, {
        bind: {
          ":type": "head",
          ":id": commitSha,
        },
      });

      notifyMain({ log: `Head ref updated ${commitSha}` });
    };

    await download(data.requestGithubDownload, onItem, onComplete);
  }
});

export default self;
