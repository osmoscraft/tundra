import type { Migration } from "./db";

export const migration01: Migration = (db: IDBDatabase) => {
  db.createObjectStore("frame", { keyPath: "id" });
};

export const migration02: Migration = (db: IDBDatabase) => {
  db.createObjectStore("baseRef", { autoIncrement: true });
  db.createObjectStore("draftFrame", { keyPath: "id" });
  db.createObjectStore("remote");
};
