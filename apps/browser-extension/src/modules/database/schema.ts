export interface DbFileWithMeta<T = any> {
  meta: T;
  path: string;

  /* Derived */
  content: string | null;
  isDeleted: 0 | 1;
  isDirty: 0 | 1;
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

export interface DbFileInternalV2 extends DbFileWritable, DbFileReadable {}
