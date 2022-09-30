import type { DBSchema, IDBPDatabase, IDBPTransaction, StoreNames } from "idb";

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
