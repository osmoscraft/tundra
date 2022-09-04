import { DBSchema, IDBPDatabase, openDB } from "idb";
import { andThen, pipe, tap } from "ramda";

export interface FileModuleConfig {
  fileStore: IDBPDatabase<FileStoreSchema>;
  onChange: (files: FileSchema[]) => any;
  onDelete: (files: FileSchema[]) => any;
}

export function getFileModule(config: FileModuleConfig) {
  return {
    getFiles: getFiles.bind(null, config.fileStore),
    getAllFiles: getAllFiles.bind(null, config.fileStore),
    putFiles: pipe(putFiles.bind(null, config.fileStore), andThen(tap(config.onChange))),
    deleteFiles: pipe(deleteFiles.bind(null, config.fileStore), andThen(tap(config.onDelete))),
    restoreFiles: pipe(restoreFiles.bind(null, config.fileStore), andThen(tap(config.onChange))),
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

export function openFileStore() {
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

async function getFiles(store: IDBPDatabase<FileStoreSchema>, ids: string[]): Promise<FileSchema[]> {
  const tx = store.transaction("file", "readonly");
  const txStore = tx.objectStore("file");
  const files = ids.map((id) => txStore.get(id)).filter(async (file) => await file) as Promise<FileSchema>[];
  await tx.done;
  return Promise.all(files);
}

async function getAllFiles(store: IDBPDatabase<FileStoreSchema>): Promise<FileSchema[]> {
  return store.getAll("file");
}

export type PutFileRequest = Pick<FileSchema, "id" | "body">;
async function putFiles(store: IDBPDatabase<FileStoreSchema>, requests: PutFileRequest[]): Promise<FileSchema[]> {
  const tx = store.transaction("file", "readwrite");
  const now = new Date();
  const txStore = tx.objectStore("file");
  const changedFiles = requests.map((req) => {
    const newFile = { ...req, dateCreated: now, dateUpdated: now };
    txStore.put(newFile);
    return newFile;
  });
  await tx.done;

  return changedFiles;
}

export type DeleteFileRequest = Pick<FileSchema, "id">;
async function deleteFiles(store: IDBPDatabase<FileStoreSchema>, requests: PutFileRequest[]): Promise<FileSchema[]> {
  const tx = store.transaction(["file", "deletedFile"], "readwrite");
  const now = new Date();
  const txStore = tx.objectStore("file");
  const deletedFileStore = tx.objectStore("deletedFile");

  const deletedFile = requests
    .map(async (req) => {
      const targetFile = await txStore.get(req.id);
      if (!targetFile) return null as any as FileSchema; // will be filtered out
      const { id, dateCreated, body } = targetFile;
      const deletedFile = { id, dateCreated, dateUpdated: now, body };

      txStore.delete(targetFile.id);
      deletedFileStore.add(deletedFile);
      return deletedFile;
    })
    .filter(async (file) => await file);
  await tx.done;

  return Promise.all(deletedFile);
}

export type RestoreFileRequest = Pick<FileSchema, "id">;
async function restoreFiles(store: IDBPDatabase<FileStoreSchema>, requests: RestoreFileRequest[]): Promise<FileSchema[]> {
  const tx = store.transaction(["file", "deletedFile"], "readwrite");
  const now = new Date();
  const txStore = tx.objectStore("file");
  const deletedFileStore = tx.objectStore("deletedFile");

  const restoredFiles = requests
    .map(async (req) => {
      const targetFile = await deletedFileStore.get(req.id);
      if (!targetFile) return null as any as FileSchema; // will be filtered out;
      const { id, dateCreated, body } = targetFile;
      const restoredFile = { id, dateCreated, dateUpdated: now, body };

      deletedFileStore.delete(targetFile.id);
      txStore.add(restoredFile);
      return restoredFile;
    })
    .filter(async (file) => await file);
  await tx.done;

  return Promise.all(restoredFiles);
}
