export interface DbFile {
  path: string;
  content: string | null;
  updatedTime: number;
  remoteUpdatedTime: number | null;
  isDirty: 0 | 1;
  isDeleted: 0 | 1;
}

export interface DbObject<T = any> {
  path: string;
  data: T;
}
