import { DBSchema, IDBPDatabase, IDBPObjectStore, openDB } from "idb";
import { memoizeZeroArity } from "../../utils/memoize";

export interface FileStoreSchema extends DBSchema {
  file: {
    value: FileSchema;
    key: string;
    indexes: {
      byDateCreated: Date;
      byDateUpdated: Date;
    };
  };
  deletedFile: {
    value: DeletedFileSchema;
    key: string;
    indexes: {
      byDateDeleted: Date;
    };
  };
}

export interface FileSchema {
  id: string;
  body: string;
  dateCreated: Date;
  dateUpdated: Date;
}
export interface DeletedFileSchema {
  id: string;
  dateCreated: Date;
  dateUpdated: Date;
}

export type GraphStore = IDBPDatabase<FileStoreSchema>;

export type WritableFileStore = IDBPObjectStore<FileStoreSchema, ["file"], "file", "readwrite">;

function openFileStore() {
  return openDB<FileStoreSchema>("tkb-file-db", 1, {
    upgrade(db, _oldVersion, _newVersion, _transaction) {
      const fileStore = db.createObjectStore("file", {
        keyPath: "id",
      });

      fileStore.createIndex("byDateCreated", "dateCreated");
      fileStore.createIndex("byDateUpdated", "dateUpdated");

      const deletedFileStore = db.createObjectStore("deletedFile", {
        keyPath: "id",
      });

      deletedFileStore.createIndex("byDateDeleted", "dateUpdated");
    },
  });
}

const getFileStore = memoizeZeroArity(openFileStore);

export async function rwTxFile<T>(task: (store: WritableFileStore) => T) {
  const store = await getFileStore();
  const tx = store.transaction("file", "readwrite");
  const result = task(tx.objectStore("file"));
  await tx.done;

  return result;
}

export async function updateFile(store: WritableFileStore, update: Pick<FileSchema, "id" | "body">): Promise<FileSchema> {
  const srcFile = await store.get(update.id);
  if (!srcFile) throw new Error("file not found");
  const file = getUpdatedFile(new Date(), { body: update.body }, srcFile);
  store.put(file);
  return file;
}

export async function addFile(store: WritableFileStore, file: Pick<FileSchema, "body">): Promise<FileSchema> {
  const fileFull = getNewFile(new Date(), { id: getNewId(), body: file.body });
  store.put(fileFull);
  return fileFull;
}

function getNewFile(dateCreated: Date, file: Pick<FileSchema, "id" | "body">): FileSchema {
  return {
    ...file,
    dateCreated,
    dateUpdated: dateCreated,
  };
}

function getUpdatedFile(dateUpdated: Date, update: Partial<FileSchema>, srcFile: FileSchema): FileSchema {
  return {
    ...srcFile,
    ...update,
    dateUpdated,
  };
}

function getNewId() {
  return crypto.randomUUID();
}
