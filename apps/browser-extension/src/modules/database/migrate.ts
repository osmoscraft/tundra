export interface Migration {
  /** 1-based version number */
  version: number;
  script: string;
}

export interface MigrateConfig {
  onWillMigrate?: (fromVersion: number, toVersion: number) => void;
  onDidMigrate?: (fromVersion: number, toVersion: number) => void;
}

export function migrate(migrations: Migration[], db: Sqlite3.DB, config?: MigrateConfig) {
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

  if (pendingMigrations.length) {
    config?.onWillMigrate?.(currentVersion, pendingMigrations.at(-1)!.version);
  }

  for (const migration of pendingMigrations) {
    db.transaction(() => {
      db.exec(migration.script);
      db.exec(`PRAGMA user_version = ${migration.version}`);
      const updatedVersion = db.selectValue<number>("PRAGMA user_version")!;

      if (updatedVersion !== migration.version) {
        throw new Error(`[db] migration to v${migration.version} failed`);
      }

      config?.onDidMigrate?.(updatedVersion - 1, updatedVersion);
    });
  }
}
