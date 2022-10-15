export const migrateTov1 = (db: IDBDatabase) => {
  db.createObjectStore("frame", { keyPath: "id" });
};
