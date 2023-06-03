export interface DbFile {
  path: string;
  content: string | null;
  updatedTime: number;
  localHash: string | null;
  remoteHash: string | null;
  isDirty: 0 | 1;
}

export interface DbObject<T = any> {
  path: string;
  data: T;
}
