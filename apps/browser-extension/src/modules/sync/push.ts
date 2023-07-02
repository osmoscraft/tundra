import { getConnection } from ".";
import type { DbFileReadable } from "../database/schema";
import type { GithubConnection } from "./github";
import { ChangeType, type BulkFileChangeItem } from "./github/operations/update-content-bulk";

export interface PushParameters {
  connection: GithubConnection;
}
export function ensurePushParameters(db: Sqlite3.DB): PushParameters {
  const connection = getConnection(db);
  if (!connection) throw new Error("Missing connection");

  return {
    connection,
  };
}

// WIP
export function dbFileToPushChangeType(file: DbFileReadable): ChangeType {
  if (!file.isDirty) return ChangeType.Clean;

  if (file.updatedAt === null) {
    // FIXME local could be deleted too
    return ChangeType.Add;
  }

  if (file.isDeleted) return ChangeType.Remove;

  return ChangeType.Modify;
}

export function localChangedFileToBulkFileChangeItem(file: DbFileReadable): BulkFileChangeItem {
  return {
    path: file.path,
    content: file.content,
    changeType: dbFileToPushChangeType(file),
  };
}
