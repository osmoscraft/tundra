export function read(db: Sqlite3.DB, globs: string[], options?: PathOptions) {}
export function rm(db: Sqlite3.DB, globs: string[], options?: PathOptions) {}
export function write(db: Sqlite3.DB, files: FileWrite[]) {}
export function search(db: Sqlite3.DB, options: SearchOptions) {}

export interface PathOptions {
  exclude?: string[];
  include?: string[];
}

export interface ListOptions {
  paths?: string[];
  limit?: number;
  orderBy?: OrderByOption[];
  direction?: DirectionOption;
  filters?: FilterOption[];
  exclude?: string[];
  include?: string[];
}

export interface SearchOptions extends ListOptions {
  query: string;
}

export enum OrderByOption {
  Path = "path",
  UpdatedAt = "updatedAt",
}

export enum DirectionOption {
  Asc = "ASC",
  Desc = "DESC",
}

export enum FilterOption {
  IsDirty = "isDirty",
  IsDeleted = "isDeleted",
}

export interface FileWrite {
  path: string;
  meta: string | null;
  localContent?: string | null;
  localUpdatedAt?: number;
  remoteContent?: string | null;
  remoteUpdatedAt?: number;
}
