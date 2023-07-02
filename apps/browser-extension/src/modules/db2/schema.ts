export interface DbFileWritable {
  localContent: string | null;
  localUpdatedAt: string;
  meta: string | null;
  path: string;
  remoteContent: string | null;
  remoteUpdatedAt: string | null;
}

export interface DbFileReadable {
  meta: string | null;
  path: string;

  /* Derived */
  content: string | null;
  isDeleted: 0 | 1;
  isDirty: 0 | 1;
  updatedAt: string | null;
}

export interface DbFile extends DbFileWritable, DbFileReadable {}
