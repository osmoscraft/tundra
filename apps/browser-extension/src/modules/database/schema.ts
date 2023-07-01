export interface DbFile {
  content: string | null;
  isDeleted: 0 | 1;
  isDirty: 0 | 1;
  meta: any;
  path: string;
  updatedAt: string | null;
}

export interface DbFileInternal {
  localContent: string | null;
  localUpdatedAt: string;
  meta: string | null;
  path: string;
  remoteContent: string | null;
  remoteUpdatedAt: string | null;

  /* Derived */
  content: string | null;
  isDeleted: 0 | 1;
  isDirty: 0 | 1;
  title: string | null;
  updatedAt: string | null;
}
