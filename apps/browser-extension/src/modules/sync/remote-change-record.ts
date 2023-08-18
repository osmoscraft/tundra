export interface RemoteChangeRecord {
  path: string;
  status: RemoteChangeStatus;
  text: string | null;
  timestamp: string;
}

export enum RemoteChangeStatus {
  Added = 1,
  Modified = 2,
  Removed = 3,
}
