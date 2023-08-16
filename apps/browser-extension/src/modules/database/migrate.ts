export interface Migration {
  /** 1-based version number */
  version: number;
  script: string;
}

export interface CreateDbOptions {
  sqliteWasmPath: string;
  migrations: Migration[];
  inMemory?: boolean;
  opfs?: {
    path: string;
  };
}
export function migrate(migrations: Migration[], db: Sqlite3.DB) {
  // assumption: db is created with version = 0
  // migration protocol:
  // open DB, get current version x (where x >= 0)
  // execute migration scripts from x+1 to latest
}
