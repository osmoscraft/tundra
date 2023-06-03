import { getConnection } from ".";
import type { DbFile } from "../database/schema";
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
export function dbFileToPushChangeType(file: DbFile): ChangeType {
  if (!file.isDirty) return ChangeType.Clean;

  if (file.remoteUpdatedTime === null) {
    // FIXME local could be deleted too
    return ChangeType.Add;
  }

  if (file.isDeleted) return ChangeType.Remove;

  return ChangeType.Modify;
}

export function dirtyFileToBulkFileChangeItem(file: DbFile): BulkFileChangeItem {
  return {
    path: file.path,
    content: file.content,
    changeType: dbFileToPushChangeType(file),
  };
}
