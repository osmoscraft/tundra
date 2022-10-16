export interface AppDBSchema {
  frame: {
    value: FrameSchema;
    key: string;
    indexes: {
      byDateUpdated: Date;
    };
  };
  draftFrame: {
    value: DraftFrameSchema;
    key: string;
    indexes: {
      byDateUpdated: Date;
    };
  };
  baseRef: {
    value: Ref;
    key: number;
  };
}

export interface FrameSchema {
  id: string;
  content: string;
  dateUpdated: Date;
}

export interface DraftFrameSchema {
  id: string;
  content: string;
  dateUpdated: Date;
  changeType: ChangeType;
}

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
