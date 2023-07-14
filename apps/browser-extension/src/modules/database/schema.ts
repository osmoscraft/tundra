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

export interface DbWritableFileV2 {
  path: string;
  local?: string | null;
  remote?: string | null;
  synced?: string | null;
}

export interface DbReadableFileV2 {
  path: string;

  /* Derived */
  content: string | null;
  isDeleted: 0 | 1;
  meta: string | null;
  status: DbFileV2Status;
  updatedAt: number | null;
  localStatus: DbFileCompareStatus | null;
  remoteStatus: DbFileCompareStatus | null;
}

export interface DbInternalFileV2 {
  path: string;
  local: string | null;
  remote: string | null;
  synced: string | null;

  /* Derived */
  content: string | null;
  isDeleted: 0 | 1;
  meta: string | null;
  source: string | null;
  status: DbFileV2Status;
  updatedAt: number | null;
  localStatus: DbFileCompareStatus | null;
  remoteStatus: DbFileCompareStatus | null;
}

/** The deserialized representation of local, remote, or synced field data */
export interface DbFileV2ParsedSource {
  updatedAt: number;
  content: string | null;
  meta: string | null;
}

export enum DbFileV2Status {
  Synced = 0,
  Behind = 1,
  Ahead = 2,
  Conflict = 3,
}

export enum DbFileCompareStatus {
  Unchanged = 0,
  Added = 1,
  Removed = 2,
  Modified = 3,
}
