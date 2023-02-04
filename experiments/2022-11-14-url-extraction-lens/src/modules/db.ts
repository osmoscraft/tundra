import { migrate, Migration, openDB, runTx } from "../utils/idb";

export interface NodeSchema {
  id: string;
  srcUrls: string[];
  targetUrls: string[];
  title: string;
  dateUpdated: Date;
}

export const migration01: Migration = (db: IDBDatabase) => {
  db.createObjectStore("node", { keyPath: "id" });
};

export const migration02: Migration = (db: IDBDatabase, tx: IDBTransaction) => {
  const nodeStore = tx.objectStore("node");
  nodeStore.createIndex("bySrcUrl", "srcUrls", { multiEntry: true });
  nodeStore.createIndex("byTargetUrl", "targetUrls", { multiEntry: true });
};

export const dbAsync = openDB("lens-store", 2, migrate([migration01, migration02]));

export const addNode = (db: IDBDatabase, node: NodeSchema) =>
  new Promise<IDBValidKey>((resolve, reject) => {
    const tx = db.transaction("node", "readwrite");
    const req = tx.objectStore("node").put(node);
    runTx(resolve, reject, tx, req);
  });

export const getNodesBySrcUrls = (db: IDBDatabase, urls: string[]) =>
  new Promise<[NodeSchema[], string[]]>((resolve, reject) => {
    const tx = db.transaction("node");

    const foundNodes: NodeSchema[] = [];
    const urlsNotFound: string[] = [];
    urls
      .map((url) => ({ req: tx.objectStore("node").index("bySrcUrl").get(url), url }))
      .map(({ req, url }) => {
        req.onerror = () => reject(req.error);
        req.onsuccess = () => (req.result ? foundNodes.push(req.result) : urlsNotFound.push(url));
      });

    tx.oncomplete = () => resolve([foundNodes, urlsNotFound]);
  });

export const getSrcNodesByTargetUrl = (db: IDBDatabase, url: string) =>
  new Promise<NodeSchema[]>((resolve, reject) => {
    const tx = db.transaction("node");
    const req = tx.objectStore("node").index("byTargetUrl").getAll(url);
    runTx(resolve, reject, tx, req);
  });

export const getNodeBySrcUrl = (db: IDBDatabase, url: string) =>
  new Promise<NodeSchema | undefined>((resolve, reject) => {
    const tx = db.transaction("node");
    const req = tx.objectStore("node").index("bySrcUrl").get(url);
    runTx(resolve, reject, tx, req);
  });

export const resetContent = (db: IDBDatabase) =>
  new Promise<undefined>((resolve, reject) => {
    const tx = db.transaction("node", "readwrite");
    const req = tx.objectStore("node").clear();
    runTx(resolve, reject, tx, req);
  });
