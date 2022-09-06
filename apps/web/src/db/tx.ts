import type { DBSchema, IDBPDatabase, IDBPTransaction, StoreNames } from "idb";
import type { AppDB, Frame } from "./db";

export type ExtractSchema<DBType> = DBType extends IDBPDatabase<infer SchemaType> ? SchemaType : never;

export type TxType<
  DBSchemaType extends DBSchema,
  Name extends StoreNames<DBSchemaType> | ArrayLike<StoreNames<DBSchemaType>>,
  Mode extends IDBTransactionMode = "readonly"
> = Name extends ArrayLike<any>
  ? IDBPTransaction<DBSchemaType, Name, Mode>
  : Name extends StoreNames<DBSchemaType>
  ? IDBPTransaction<DBSchemaType, [Name], Mode>
  : never;

export async function tx<
  DBType extends IDBPDatabase<any>,
  Names extends StoreNames<ExtractSchema<DBType>> | ArrayLike<StoreNames<ExtractSchema<DBType>>>,
  Mode extends IDBTransactionMode,
  Transact extends (tx: TxType<ExtractSchema<DBType>, Names, Mode>) => any
>(db: DBType, names: Names, mode: Mode, transact: Transact): Promise<Awaited<ReturnType<Transact>>> {
  const tx = db.transaction(names, mode);
  const result = transact(tx as any);
  await tx.done;

  return await result;
}

export async function resetTx(db: AppDB, items: Frame[], localBaseSha: string) {
  return tx(db, ["frame", "localBaseSha", "localChange", "remoteChange"], "readwrite", (tx) => {
    tx.objectStore("localChange").clear();
    tx.objectStore("remoteChange").clear();

    const frameStore = tx.objectStore("frame");
    frameStore.clear();
    items.forEach((item) => frameStore.put(item));

    const localBaseRefStore = tx.objectStore("localBaseSha");
    localBaseRefStore.clear();
    localBaseRefStore.add(localBaseSha);
  });
}

export interface RecentFrame {
  id: string;
  content: string;
  dateUpdated: Date;
  status: Status;
}
export enum Status {
  Clean = 0,
  Create = 1,
  Update = 2,
  Delete = 3,
}
export async function getRecentFramesTx(db: AppDB, limit = 10): Promise<RecentFrame[]> {
  return tx(db, ["frame", "localChange"], "readwrite", async (tx) => {
    const frameStore = tx.objectStore("frame");
    const localChangeStore = tx.objectStore("localChange");

    const results: Frame[] = [];
    let cursor = await frameStore.index("byDateUpdated").openCursor();
    while (cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }

    const recentFrames = Promise.all(
      results.map(async (result) => {
        const change = await localChangeStore.get(result.id);
        return {
          id: result.id,
          content: result.content,
          dateUpdated: result.dateUpdated,
          status:
            change?.content && change?.previousContent
              ? Status.Update
              : change?.content && !change?.previousContent
              ? Status.Create
              : !change?.content && change?.previousContent
              ? Status.Delete
              : Status.Clean,
        };
      })
    );

    return recentFrames;
  });
}
