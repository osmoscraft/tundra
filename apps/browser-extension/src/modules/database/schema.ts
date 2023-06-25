export interface DbFile {
  path: string;
  title: string | null;
  content: string | null;
  updatedTime: string | null;
  isDirty: 0 | 1;
  isDeleted: 0 | 1;
}

export interface DbFileInternal extends DbFile {
  meta: any;
  localContent: string | null;
  localUpdatedTime: string;
  remoteContent: string | null;
  remoteUpdatedTime: string | null;
}

export interface DbObject<T = any> {
  path: string;
  data: T;
}

export interface DbNode {
  path: string;
  title: string;
}

export interface DbNodeInternal extends DbNode {
  data: any;
}
