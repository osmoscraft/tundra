export interface DbFile {
  path: string;
  content: string | null;
  updatedTime: string | null;
  isDirty: 0 | 1;
  isDeleted: 0 | 1;
  meta: any;
}

export interface DbFileInternal {
  path: string;
  localContent: string | null;
  localUpdatedTime: string;
  remoteContent: string | null;
  remoteUpdatedTime: string | null;
  meta: string | null;

  /* Derived */
  content: string | null;
  title: string | null;
  isDeleted: 0 | 1;
  isDirty: 0 | 1;
  updatedTime: string | null;
}
