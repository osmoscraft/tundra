export interface DbGithubConnection {
  owner: string | null;
  repo: string | null;
  token: string;
}

export interface DbGithubRef {
  id: string;
}

export enum DbFileChangeSource {
  Local = 1,
  Remote = 2,
  Both = 3,
}

export enum DbFileChangeStatus {
  Unchanged = 0,
  Added = 1,
  Modified = 2,
  Removed = 3,
  Conflict = 4,
}

export interface DbFileChange {
  path: string;
  localHash: string | null;
  localHashTime: string | null;
  remoteHash: string | null;
  remoteHashTime: string | null;
  source: DbFileChangeSource;
  status: DbFileChangeStatus;
}
