import DELETE_FILE from "../file-system/sql/delete-file.sql";
import UPSERT_FILE from "../file-system/sql/upsert-file.sql";

export async function mergeChangedFile(fsDb: Sqlite3.DB, path: string, content: string | null) {
  if (content === null) {
    fsDb.exec(DELETE_FILE, {
      bind: {
        ":path": path,
      },
    });
    console.log("[merge] delete", path);
  } else {
    fsDb.exec(UPSERT_FILE, {
      bind: {
        ":path": path,
        ":type": "text/plain",
        ":content": content,
      },
    });
    console.log("[merge] change", path);
  }
}
