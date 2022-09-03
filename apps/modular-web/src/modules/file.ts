import { DBSchema, IDBPDatabase, openDB } from "idb";
import { pipe, tap } from "ramda";
import { memoizeZeroArity } from "../utils/memoize";

export interface FileModuleConfig {
  onChange?: (files: FileSchema[]) => any;
  onDelete?: (files: FileSchema[]) => any;
}

export function getFileModule(config: FileModuleConfig) {
  const getFileStore = memoizeZeroArity(openFileStore);

  return {
    getFiles: getFiles.bind(null, getFileStore),
    getAllFiles: getAllFiles.bind(null, getFileStore),
    putFiles: pipe(
      putFiles.bind(null, getFileStore),
      tap(async (files) => config.onChange?.(await files))
    ),
    deleteFiles: pipe(
      deleteFiles.bind(null, getFileStore),
      tap(async (files) => config.onDelete?.(await files))
    ),
    restoreFiles: pipe(
      restoreFiles.bind(null, getFileStore),
      tap(async (files) => config.onChange?.(await files))
    ),
  };
}

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
  body: string;
  dateCreated: Date;
  dateUpdated: Date;
}

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

async function getFiles(getStore: () => Promise<IDBPDatabase<FileStoreSchema>>, ids: string[]): Promise<FileSchema[]> {
  const tx = (await getStore()).transaction("file", "readonly");
  const store = tx.objectStore("file");
  const files = ids.map((id) => store.get(id)).filter(async (file) => await file) as Promise<FileSchema>[];
  await tx.done;
  return Promise.all(files);
}

async function getAllFiles(getStore: () => Promise<IDBPDatabase<FileStoreSchema>>): Promise<FileSchema[]> {
  const store = await getStore();
  return store.getAll("file");
}

export type PutFileRequest = Pick<FileSchema, "id" | "body">;
async function putFiles(getStore: () => Promise<IDBPDatabase<FileStoreSchema>>, requests: PutFileRequest[]): Promise<FileSchema[]> {
  const tx = (await getStore()).transaction("file", "readwrite");
  const now = new Date();
  const store = tx.objectStore("file");
  const changedFiles = requests.map((req) => {
    const newFile = { ...req, dateCreated: now, dateUpdated: now };
    store.put(newFile);
    return newFile;
  });
  await tx.done;

  return changedFiles;
}

export type DeleteFileRequest = Pick<FileSchema, "id">;
async function deleteFiles(getStore: () => Promise<IDBPDatabase<FileStoreSchema>>, requests: PutFileRequest[]): Promise<FileSchema[]> {
  const tx = (await getStore()).transaction(["file", "deletedFile"], "readwrite");
  const now = new Date();
  const fileStore = tx.objectStore("file");
  const deletedFileStore = tx.objectStore("deletedFile");

  const deletedFile = requests
    .map(async (req) => {
      const targetFile = await fileStore.get(req.id);
      if (!targetFile) return null as any as FileSchema; // will be filtered out
      const { id, dateCreated, body } = targetFile;
      const deletedFile = { id, dateCreated, dateUpdated: now, body };

      fileStore.delete(targetFile.id);
      deletedFileStore.add(deletedFile);
      return deletedFile;
    })
    .filter(async (file) => await file);
  await tx.done;

  return Promise.all(deletedFile);
}

export type RestoreFileRequest = Pick<FileSchema, "id">;
async function restoreFiles(getStore: () => Promise<IDBPDatabase<FileStoreSchema>>, requests: RestoreFileRequest[]): Promise<FileSchema[]> {
  const tx = (await getStore()).transaction(["file", "deletedFile"], "readwrite");
  const now = new Date();
  const fileStore = tx.objectStore("file");
  const deletedFileStore = tx.objectStore("deletedFile");

  const restoredFiles = requests
    .map(async (req) => {
      const targetFile = await deletedFileStore.get(req.id);
      if (!targetFile) return null as any as FileSchema; // will be filtered out;
      const { id, dateCreated, body } = targetFile;
      const restoredFile = { id, dateCreated, dateUpdated: now, body };

      deletedFileStore.delete(targetFile.id);
      fileStore.add(restoredFile);
      return restoredFile;
    })
    .filter(async (file) => await file);
  await tx.done;

  return Promise.all(restoredFiles);
}
