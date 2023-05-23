export interface RemoteChangeRecord {
  path: string;
  status: RemoteChangeStatus;
  readText: () => string | null | Promise<string | null>;
  readTimestamp: () => string | Promise<string>;
}

export enum RemoteChangeStatus {
  Added = 1,
  Modified = 2,
  Removed = 3,
}
