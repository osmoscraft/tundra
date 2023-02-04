export function openDB(name: string, version: number, handleUpgrade: (e: IDBVersionChangeEvent) => any) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (e) => handleUpgrade(e);
    req.onerror = () => reject(req.error);
    req.onsuccess = (event) => resolve(((event.target as any).result as IDBDatabase) ?? null);
  });
}

export type Migration = (db: IDBDatabase, tx: IDBTransaction) => any;

export const migrate = (migrations: Migration[]) => (event: IDBVersionChangeEvent) =>
  migrations
    .slice(event.oldVersion, event.newVersion!)
    .map((migrate) =>
      migrate((event.target as any).result as IDBDatabase, (event.target as any).transaction as IDBTransaction)
    );

export const runTx = (resolve: (value: any) => any, reject: (err: any) => any, tx: IDBTransaction, req: IDBRequest) => {
  tx.onerror = () => reject(tx.error);
  tx.oncomplete = () => resolve(req.result);
};
