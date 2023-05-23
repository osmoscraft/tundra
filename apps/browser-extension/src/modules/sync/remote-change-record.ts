export interface RemoteChangeRecord {
  path: string;
  timestamp: string;
  status: RemoteChangeStatus;
  readText: () => Promise<string | null>;
}

export enum RemoteChangeStatus {
  Added = 1,
  Modified = 2,
  Removed = 3,
}
