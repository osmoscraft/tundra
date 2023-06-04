export interface DbFile {
  path: string;
  localContent: string | null;
  localUpdatedTime: string;
  remoteContent: string | null;
  remoteUpdatedTime: string | null;
  content: string | null;
  updatedTime: string | null;
  isDirty: 0 | 1;
  isDeleted: 0 | 1;
}

export interface DbObject<T = any> {
  path: string;
  data: T;
}
