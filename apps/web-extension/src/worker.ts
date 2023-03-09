import { initDb } from "./modules/db/init";
import { download, testConnection } from "./modules/sync/github/operations";
import { getNotifier, getResponder } from "./modules/worker/notify";
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

export default self;
