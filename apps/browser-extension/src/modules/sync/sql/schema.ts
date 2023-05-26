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
}

export enum DbFileChangeStatus {
  Unchanged = 0,
  Created = 1,
  Updated = 2,
  Deleted = 3,
}

export interface DbFileChange {
  path: string;
  localHash: string | null;
  localHashTime: string | null;
  remoteContent: string | null;
  remoteHash: string | null;
  remoteHashTime: string | null;
  source: DbFileChangeSource;
  status: DbFileChangeStatus;
}
