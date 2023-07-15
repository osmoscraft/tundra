import { getConnection } from ".";
import { DbFileAction, type DbReadableFileV2 } from "../database/schema";
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
export type PushFile = Pick<
  DbReadableFileV2,
  "path" | "content" | "status" | "updatedAt" | "localAction" | "remoteAction"
>;
export function dbFileToPushChangeType(file: PushFile): ChangeType {
  if (file.localAction === DbFileAction.Add) return ChangeType.Add;
  if (file.localAction === DbFileAction.Remove) return ChangeType.Remove;
  if (file.localAction === DbFileAction.Modify) return ChangeType.Modify;
  return ChangeType.None;
}

export function localChangedFileToBulkFileChangeItem(file: PushFile): BulkFileChangeItem {
  return {
    path: file.path,
    content: file.content,
    changeType: dbFileToPushChangeType(file),
  };
}
