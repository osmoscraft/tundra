export function openDB(name: string, version: number, handleUpgrade: (e: IDBVersionChangeEvent) => any) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (e) => handleUpgrade(e);
    req.onerror = () => reject(req.error);
    req.onsuccess = (event) => resolve(((event.target as any).result as IDBDatabase) ?? null);
  });
}

export type Migration = (db: IDBDatabase) => any;

export const migrate = (migrations: Migration[]) => (event: IDBVersionChangeEvent) =>
  migrations.slice(event.oldVersion, event.newVersion!).map((migrate) => migrate((event.target as any).result as IDBDatabase));

export function storesTx<ResultType>(
  db: IDBDatabase,
  storeNames: string[],
  mode: IDBTransactionMode,
  run: (stores: IDBPromiseObjectStore[]) => Promise<ResultType>
): Promise<ResultType> {
  return new Promise(async (resolve, reject) => {
    const activeTx = db.transaction(storeNames, mode);

    const stores = storeNames.map((storeName) => wrapStore(activeTx.objectStore(storeName)));
    const result = await run(stores);

    activeTx.onerror = () => reject(activeTx.error);
    activeTx.oncomplete = () => resolve(result);
  });
}

export function runOnStore<ReturnType>(
  tx: IDBTransaction,
  storeName: string,
  routine: (store: IDBPromiseObjectStore) => Promise<ReturnType>
): Promise<ReturnType> {
  const store = tx.objectStore(storeName);
  return routine(wrapStore(store));
}

const storeProxyMethods: (keyof IDBObjectStore)[] = ["get", "getAll", "add", "delete", "put", "clear"];

function wrapStore(store: IDBObjectStore) {
  return new Proxy(store, {
    get: (target, prop) => {
      if (storeProxyMethods.includes(prop as any)) {
        return (...args: any[]) =>
          new Promise((resolve, reject) => {
            const req = (target as any)[prop](...args) as IDBRequest;
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve(req.result);
          });
      } else {
        return (target as any)[prop];
      }
    },
  }) as any as IDBPromiseObjectStore;
}

type PromisifyIDBRequest<ReqType extends IDBRequest> = ReqType extends IDBRequest<infer ReturnType> ? Promise<ReturnType> : never;

type IDBPromiseObjectStore = {
  [key in keyof IDBObjectStore]: IDBObjectStore[key] extends (...args: infer ArgsType) => IDBRequest<infer T>
    ? (...args: ArgsType) => PromisifyIDBRequest<IDBRequest<T>>
    : IDBObjectStore[key];
};
