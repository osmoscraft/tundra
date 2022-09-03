import { DBSchema, IDBPDatabase, openDB } from "idb";
import { pipe } from "ramda";
import { dispatchCustom } from "../../utils/event";
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

export function getFileModule() {
  const eventTarget = new EventTarget();
  const getFileStore = memoizeZeroArity(openFileStore);

  return {
    eventTarget,
    putFiles: pipe(
      putFiles.bind(null, getFileStore),
      async (files) => dispatchCustom(eventTarget, "changed", { files: await files, cause: "update" }),
      extractFiles
    ),
    deleteFiles: pipe(
      deleteFiles.bind(null, getFileStore),
      async (files) => dispatchCustom(eventTarget, "changed", { files: await files, cause: "delelte" }),
      extractFiles
    ),
    restoreFiles: pipe(
      restoreFiles.bind(null, getFileStore),
      async (files) => dispatchCustom(eventTarget, "changed", { files: await files, cause: "restore" }),
      extractFiles
    ),
  };
}

const extractFiles = async <T>(event: Promise<CustomEvent<{ files: T }>>) => (await event).detail.files;

export type PutFileRequest = Pick<FileSchema, "id" | "body">;
async function putFiles(getStore: () => Promise<IDBPDatabase<FileStoreSchema>>, requests: PutFileRequest[]): Promise<FileSchema[]> {
  const tx = (await getStore()).transaction("file", "readwrite");
  const now = new Date();
  const changedFiles = requests.map((req) => {
    const newFile = { ...req, dateCreated: now, dateUpdated: now };
    tx.objectStore("file").put(newFile);
    return newFile;
  });
  await tx.done;

  return changedFiles;
}
export type DeleteFileRequest = Pick<FileSchema, "id">;

async function deleteFiles(getStore: () => Promise<IDBPDatabase<FileStoreSchema>>, requests: PutFileRequest[]): Promise<FileSchema[]> {
  const tx = (await getStore()).transaction(["file", "deletedFile"], "readwrite");
  const now = new Date();

  const deletedFile = requests
    .map(async (req) => {
      const targetFile = await tx.objectStore("file").get(req.id);
      if (!targetFile) return null as any as FileSchema; // will be filtered out
      const { id, dateCreated, body } = targetFile;
      const deletedFile = { id, dateCreated, dateUpdated: now, body };

      tx.objectStore("file").delete(targetFile.id);
      tx.objectStore("deletedFile").add(deletedFile);
      return deletedFile;
    })
    .filter(async (file) => await file);
  await tx.done;

  return Promise.all(deletedFile);
}

async function restoreFiles(getStore: () => Promise<IDBPDatabase<FileStoreSchema>>, requests: PutFileRequest[]): Promise<FileSchema[]> {
  const tx = (await getStore()).transaction(["file", "deletedFile"], "readwrite");
  const now = new Date();

  const restoredFiles = requests
    .map(async (req) => {
      const targetFile = await tx.objectStore("deletedFile").get(req.id);
      if (!targetFile) return null as any as FileSchema; // will be filtered out;
      const { id, dateCreated, body } = targetFile;
      const restoredFile = { id, dateCreated, dateUpdated: now, body };

      tx.objectStore("deletedFile").delete(targetFile.id);
      tx.objectStore("file").add(restoredFile);
      return restoredFile;
    })
    .filter(async (file) => await file);
  await tx.done;

  return Promise.all(restoredFiles);
}
