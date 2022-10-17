export type RemoteStore = {
  type: RemoteType.GitHubToken;
  connection: GitHubConnection;
};

export interface FrameStore {
  id: string;
  content: string;
  dateUpdated: Date;
}

export interface DraftFrameStore {
  id: string;
  content: string;
  dateUpdated: Date;
  changeType: ChangeType;
}

export type BaseRefStore = Ref;

export enum ChangeType {
  Clean = 0,
  Create = 1,
  Update = 2,
  Delete = 3,
}

export interface Ref {
  sha: string;
}

export interface RemoteChangeItem {
  id: string;
  content: string | null;
}

export interface FrameChangeItem {
  changeType: ChangeType;
  id: string;
  content: string;
}

export enum RemoteType {
  GitHubToken = 1,
}

export interface GitHubConnection {
  owner: string;
  repo: string;
  token: string;
}
