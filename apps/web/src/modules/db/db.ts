export function openDB(name: string, version: number, handleUpgrade: (db: IDBDatabase) => any) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (e) => handleUpgrade((e.target as any).result);
    req.onerror = () => reject(req.error);
    req.onsuccess = (event) => resolve(((event.target as any).result as IDBDatabase) ?? null);
  });
}

export function tx<ResultType>(
  db: IDBDatabase,
  storeNames: string | string[],
  mode: IDBTransactionMode,
  transact: (tx: IDBTransaction) => Promise<ResultType>
): Promise<ResultType> {
  return new Promise(async (resolve, reject) => {
    const activeTx = db.transaction(storeNames, mode);

    const result = await transact(activeTx);

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

function wrapStore(store: IDBObjectStore) {
  return new Proxy(store, {
    get: (target, prop) => {
      if (["get", "getAll"].includes(prop as string)) {
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
