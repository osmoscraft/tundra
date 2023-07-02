export interface DbFile {
  content: string | null;
  isDeleted: 0 | 1;
  isDirty: 0 | 1;
  meta: any;
  path: string;
  updatedAt: number | null;
}

export interface DbFileInternal {
  localContent: string | null;
  localUpdatedAt: number;
  meta: string | null;
  path: string;
  remoteContent: string | null;
  remoteUpdatedAt: number | null;

  /* Derived */
  content: string | null;
  isDeleted: 0 | 1;
  isDirty: 0 | 1;
  title: string | null;
  updatedAt: number | null;
}
