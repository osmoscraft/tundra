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

export interface DbFileV2Internal {
  baseContent: string | null;
  baseUpdatedAt: number;
  localContent: string | null;
  localUpdatedAt: number;
  meta: string | null;
  path: string;
  status: DbFileStatus;
  remoteContent: string | null;
  remoteUpdatedAt: number | null;
}

export enum DbFileStatus {
  Untracked = 0,
  Unchanged = 1,
  S2 = 2,
  S3 = 3,
  Added = 4,
  Modified = 5,
  S6 = 6,
  Conflict = 7,
}
