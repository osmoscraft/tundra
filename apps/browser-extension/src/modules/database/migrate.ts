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
  /**
   * Assumptions:
   * - db is created with version = 0
   * - migrations are sorted by version in ascending order
   */
  // migration protocol:
  // get current version x (where x >= 0)
  const currentVersion = db.selectValue<number>("PRAGMA user_version")!;

  // execute migration scripts from x+1 to latest
  const pendingMigrations = migrations.filter((m) => m.version > currentVersion);

  for (const migration of pendingMigrations) {
    db.transaction(() => {
      db.exec(migration.script);
      db.exec(`PRAGMA user_version = ${migration.version}`);
    });
  }
}
