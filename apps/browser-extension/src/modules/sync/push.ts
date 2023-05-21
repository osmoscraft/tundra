import { getConnection } from ".";
import { readFile } from "../file-system";
import type { GithubConnection } from "./github";
import { ChangeType, type BulkFileChangeItem } from "./github/operations/update-content-bulk";
import { DbFileChangeStatus, type DbFileChange } from "./sql/schema";

export interface FetchParameters {
  connection: GithubConnection;
}
export function ensurePushParameters(syncDb: Sqlite3.DB): FetchParameters {
  const connection = getConnection(syncDb);
  if (!connection) throw new Error("Missing connection");

  return {
    connection,
  };
}

export function syncStatusToPushChangeType(staus: DbFileChangeStatus): ChangeType {
  switch (staus) {
    case DbFileChangeStatus.Unchanged:
      return ChangeType.Clean;
    case DbFileChangeStatus.Added:
      return ChangeType.Add;
    case DbFileChangeStatus.Modified:
      return ChangeType.Modify;
    case DbFileChangeStatus.Removed:
      return ChangeType.Remove;
    default:
      throw new Error(`Unsupported status for push operation: ${staus}`);
  }
}

export function fileChangeToBulkFileChangeItem(fsDb: Sqlite3.DB, fileChange: DbFileChange): BulkFileChangeItem {
  return {
    path: fileChange.path,
    content: readFile(fsDb, fileChange.path)?.content ?? null,
    changeType: syncStatusToPushChangeType(fileChange.status),
  };
}
