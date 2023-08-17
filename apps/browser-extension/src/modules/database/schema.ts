export interface DbWritableFile {
  path: string;
  local?: string | null;
  remote?: string | null;
  synced?: string | null;
}

export interface DbReadableFile {
  path: string;
  local: string | null;
  remote: string | null;

  /* Derived */
  content: string | null;
  meta: string | null;
  status: DbFileStatus;
  updatedAt: number | null;
  localAction: DbFileAction;
  remoteAction: DbFileAction;
}

export interface DbInternalFile {
  path: string;
  local: string | null;
  remote: string | null;
  synced: string | null;

  /* Derived */
  content: string | null;
  meta: string | null;
  source: string | null;
  status: DbFileStatus;
  updatedAt: number | null;
  localAction: DbFileAction;
  remoteAction: DbFileAction;
}

/** The deserialized representation of local, remote, or synced field data */
export interface DbFileParsedSource {
  updatedAt: number;
  content: string | null;
  meta: string | null;
}

export enum DbFileStatus {
  Synced = 0,
  Behind = 1,
  Ahead = 2,
  Conflict = 3,
}

export enum DbFileAction {
  None = 0,
  Add = 1,
  Remove = 2,
  Modify = 3,
}
