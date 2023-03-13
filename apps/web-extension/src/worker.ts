import { applyPatch, parsePatch } from "diff";

import { getDbFile, initDb } from "./modules/db/init";
import { getNotifier, getResponder } from "./modules/worker/notify";

import DELETE_ALL_NODES from "./modules/db/statements/delete-all-nodes.sql";
import DELETE_NODE from "./modules/db/statements/delete-node.sql";
import GET_REF from "./modules/db/statements/get-ref.sql";
import INSERT_NODE from "./modules/db/statements/insert-node.sql";
import MATCH_NODES_BY_TEXT from "./modules/db/statements/match-nodes-by-text.sql";
import SELECT_NODE_BY_PATH from "./modules/db/statements/select-node-by-path.sql";
import SELECT_NODE_BY_URL from "./modules/db/statements/select-node-by-url.sql";
import SELECT_RECENT_NODES from "./modules/db/statements/select-recent-nodes.sql";
import SET_REF from "./modules/db/statements/set-ref.sql";
import UPSERT_NODE from "./modules/db/statements/upsert-node.sql";

import { destoryDb } from "./modules/db/init";
import { internalQuery } from "./modules/search/get-query";
import { compare } from "./modules/sync/github/operations/compare";
import { download } from "./modules/sync/github/operations/download";
import { getBlob } from "./modules/sync/github/operations/get-blob";
import { getContent } from "./modules/sync/github/operations/get-content";
import { getRemoteHeadRef } from "./modules/sync/github/operations/get-remote-head-ref";
import { testConnection } from "./modules/sync/github/operations/test-connection";
import { updateContent } from "./modules/sync/github/operations/update-content";
import type { MessageToMainV2, MessageToWorkerV2 } from "./typings/messages";
import { b64DecodeUnicode } from "./utils/base64";
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
    const currentNode = data.requestCapture.isUpdate
      ? await getContent(data.requestCapture.githubConnection, data.requestCapture.node.path)
      : undefined;

    const pushResult = await updateContent(data.requestCapture!.githubConnection, {
      path: data.requestCapture.node.path,
      sha: currentNode?.sha,
      content: JSON.stringify(
        {
          ...data.requestCapture.node,
          modifiedAt: new Date().toISOString(),
        },
        null,
        2
      ),
    });

    console.log("created", pushResult);
    respondMain(data, { respondCapture: pushResult.commit.sha });
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

  if (data.requestDbNodesRecent) {
    const db = await dbPromise;
    const nodes = db
      .selectObjects<{ path: string; content: string }>(SELECT_RECENT_NODES)
      .filter((rawNode) => rawNode.path.endsWith(".json"))
      .map((rawNode) => ({
        path: rawNode.path,
        content: JSON.parse(rawNode.content),
      }));

    respondMain(data, { respondDbNodesRecent: nodes });
  }

  if (data.requestDbNodesByUrls) {
    const db = await dbPromise;
    const results = data.requestDbNodesByUrls
      .flatMap((url) =>
        db.selectObjects<{ path: string; content: any }>(SELECT_NODE_BY_URL, {
          ":url": url,
        })
      )
      .filter((rawNode) => rawNode.path.endsWith(".json"))
      .map((rawNode) => ({
        path: rawNode.path,
        content: JSON.parse(rawNode.content),
      }));

    respondMain(data, {
      respondDbNodesByUrls: results,
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
    const isSuccess = await testConnection(data.requestGithubDownload);
    notifyMain({ log: isSuccess ? "Connection sucessful!" : "Connection failed." });
    if (!isSuccess) return;

    const db = await dbPromise;
    // TODO load item path and content into DB

    db.exec(DELETE_ALL_NODES);

    let itemCount = 0;
    const onItem = async (path: string, getContent: () => Promise<string>) => {
      if (!path.endsWith(".json")) {
        notifyMain({ log: `Skip non-json item ${++itemCount} ${path}` });
        return;
      } else {
        notifyMain({ log: `Download item ${++itemCount} ${path}` });
      }

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

  if (data.requestGithubPull) {
    const db = await dbPromise;
    const localHeadRef = db.selectObject<{ id: string; type: string }>(GET_REF, {
      ":type": "head",
    });

    if (!localHeadRef) {
      notifyMain({ log: `No local ref. An initial import is required.` });
      respondMain(data, {
        respondGitHubPull: {
          isSuccess: false,
          changeCount: 0,
        },
      });
      return;
    }

    // compare local with remote
    const remoteHeadRef = await getRemoteHeadRef(data.requestGithubPull);
    if (localHeadRef.id === remoteHeadRef) {
      notifyMain({ log: `Already up-to-date.` });
      respondMain(data, {
        respondGitHubPull: {
          isSuccess: true,
          changeCount: 0,
        },
      });
      return;
    }

    const compareResults = await compare(data.requestGithubPull, {
      base: localHeadRef.id,
      head: remoteHeadRef,
    });

    console.log(`[pull] compare results`, compareResults);

    const allChangedFiles = compareResults.files
      .filter((file) => file.filename.startsWith("nodes/"))
      .filter((file) => file.status !== "removed")
      .map((file) => ({
        path: file.filename,
        sha: file.sha,
        localContent:
          db.selectObject<{ path: string; content: string }>(SELECT_NODE_BY_PATH, {
            ":path": file.filename,
          })?.content ?? "",
        patch: file.patch,
        parsedPatches: file.patch ? parsePatch(file.patch) : null,
      }));

    console.log(`[pull] all changes`, allChangedFiles);

    const patchedFiles = await Promise.all(
      allChangedFiles.map(async (change) => ({
        ...change,
        latestContent: change.parsedPatches
          ? applyPatch(change.localContent, change.parsedPatches[0])
          : b64DecodeUnicode((await getBlob(data.requestGithubPull!, { sha: change.sha })).content),
      }))
    );

    console.log(`[pull] all patched`, patchedFiles);

    const allDeletedFiles = compareResults.files
      .filter((file) => file.filename.startsWith("nodes/"))
      .filter((file) => file.status === "removed");

    patchedFiles.forEach((change) => {
      notifyMain({ log: `Updating ${change.path}` });
      db.exec(UPSERT_NODE, {
        bind: {
          ":path": change.path,
          ":content": change.latestContent,
        },
      });
    });

    allDeletedFiles.forEach((file) => {
      notifyMain({ log: `Deleting ${file.filename}` });
      db.exec(DELETE_NODE, {
        bind: {
          ":path": file.filename,
        },
      });
    });

    db.exec(SET_REF, {
      bind: {
        ":type": "head",
        ":id": remoteHeadRef,
      },
    });

    respondMain(data, {
      respondGitHubPull: {
        isSuccess: true,
        changeCount: patchedFiles.length,
      },
    });

    notifyMain({ log: `Pull success. ${patchedFiles.length} updated. ${allDeletedFiles.length} deleted.` });
  }
});

export default self;
