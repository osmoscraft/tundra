import { getConnection } from ".";
import { DbFileV2Status, type DbReadableFileV2 } from "../database/schema";
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
export type PushFile = Pick<DbReadableFileV2, "path" | "content" | "status" | "updatedAt" | "isDeleted">;
export function dbFileToPushChangeType(file: PushFile): ChangeType {
  if (file.status !== DbFileV2Status.Ahead) return ChangeType.Clean;

  if (file.updatedAt === null) {
    // FIXME need a way to detect file creation
    return ChangeType.Add;
  }

  if (file.isDeleted) return ChangeType.Remove;

  return ChangeType.Modify;
}

export function localChangedFileToBulkFileChangeItem(file: PushFile): BulkFileChangeItem {
  return {
    path: file.path,
    content: file.content,
    changeType: dbFileToPushChangeType(file),
  };
}
