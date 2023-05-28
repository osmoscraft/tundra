export interface RemoteChangeRecord {
  path: string;
  status: RemoteChangeStatus;
  text: string | null;
  timestamp: string;
}

export enum RemoteChangeStatus {
  Created = 1,
  Updated = 2,
  Deleted = 3,
}
