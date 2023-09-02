import { getConnection } from ".";
import type { GithubConnection } from "./github";

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
