export interface DbFileWritable {
  localContent: string | null;
  localUpdatedAt: number;
  meta: string | null;
  path: string;
  remoteContent: string | null;
  remoteUpdatedAt: number | null;
}

export interface DbFileReadable {
  meta: string | null;
  path: string;

  /* Derived */
  content: string | null;
  isDeleted: 0 | 1;
  isDirty: 0 | 1;
  updatedAt: number | null;
}

export type DbFileWithMeta<T = any> = DbFileReadable & { meta: T };

export interface DbFileInternal extends DbFileWritable, DbFileReadable {}
