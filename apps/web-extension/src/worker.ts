import { getDbFile, initDb } from "./modules/db/init";
import { ChangeType, download, DraftNode, push, testConnection } from "./modules/sync/github/operations";
import { getNotifier, getResponder } from "./modules/worker/notify";

import DELETE_ALL_NODES from "./modules/db/statements/delete-all-nodes.sql";
import INSERT_NODE from "./modules/db/statements/insert-node.sql";

import { destoryDb } from "./modules/db/init";
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
    console.log(data);

    const draft: DraftNode = {
      path: `${Date.now().toString()}.json`,
      content: JSON.stringify(data.requestCapture.data!, null, 2),
      changeType: ChangeType.Create,
    };

    const result = await push(data.requestCapture!.githubConnection, [draft]);
    respondMain(data, { respondCapture: result?.commitSha ?? "" });
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
          ":path": path.slice(path.indexOf("/")),
          ":content": await getContent(),
        },
      });
    };

    await download(data.requestGithubDownload, onItem);
  }
});

export default self;
