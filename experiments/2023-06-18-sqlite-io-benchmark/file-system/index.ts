import { asyncPipe, callOnce } from "@tinykb/fp-utils";
import { sqlite3Opfs } from "@tinykb/sqlite-utils";
import { deleteAllFiles } from "../database";
import DELETE_FILE from "./sql/delete-file.sql";
import LIST_FILES from "./sql/list-files.sql";
import type { DbFile } from "./sql/schema";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE from "./sql/select-file.sql";
import UPSERT_FILE from "./sql/upsert-file.sql";
export * from "./benchmark";
export * from "./check-health";
export * from "./sql/schema";

export const init = callOnce(
  asyncPipe(sqlite3Opfs.bind(null, "./sqlite3/jswasm/"), (db: Sqlite3.DB) => {
    db.exec(SCHEMA);
    return db;
  })
);

export function clear(db: Sqlite3.DB) {
  deleteAllFiles(db);
}

export function writeFile(db: Sqlite3.DB, path: string, content: string | null) {
  return db.exec(UPSERT_FILE, {
    bind: {
      ":path": path,
      ":content": content,
    },
  });
}

export function writeFiles(db: Sqlite3.DB, files: { path: string; content: string }[]) {
  return db.exec(
    `
INSERT INTO File(path, content) VALUES
  ${files.map((_, i) => `(:path${i}, :content${i})`).join(",")}
ON CONFLICT(path) DO UPDATE SET content = :content
  `.trim(),
    {
      bind: {
        ...files.reduce((acc, { path, content }, i) => {
          acc[`:path${i}`] = path;
          acc[`:content${i}`] = content;
          return acc;
        }, {} as Record<string, string>),
      },
    }
  );
}

/**
 * TODO swith to tombstone pattern for fault tolerant delete propagation to other modules
 * Set content to `null` for deletion
 */
export function writeOrDeleteFile(db: Sqlite3.DB, path: string, content: string | null) {
  if (content === null) {
    db.exec(DELETE_FILE, {
      bind: {
        ":path": path,
      },
    });
  } else {
    db.exec(UPSERT_FILE, {
      bind: {
        ":path": path,
        ":content": content,
      },
    });
  }
}

export function readFile(db: Sqlite3.DB, path: string) {
  return db.selectObject<DbFile>(SELECT_FILE, {
    ":path": path,
  });
}

export function listFiles(db: Sqlite3.DB, limit: number, offset: number) {
  return db.selectObjects<DbFile>(LIST_FILES, {
    ":limit": limit,
    ":offset": offset,
  });
}

export interface QueryConfig {
  minUpdatedTime?: string;
  limit?: number;
  offset?: number;
}
export function queryFiles(db: Sqlite3.DB, config: QueryConfig = {}) {
  const appendClause: string[] = [];
  const appendDict: Record<string, string> = {};
  if (Object.keys(config).length > 0) {
    appendClause.push(" WHERE");
  }

  if (config.minUpdatedTime) {
    appendClause.push("updatedTime > :minUpdatedTime");
    appendDict[":minUpdatedTime"] = config.minUpdatedTime;
  }

  if (config.limit) {
    appendClause.push("LIMIT :limit");
    appendDict[":limit"] = config.limit.toString();
  }

  if (config.offset) {
    appendClause.push("OFFSET :offset");
    appendDict[":offset"] = config.offset.toString();
  }

  return db.selectObjects<DbFile>(`SELECT * FROM File ${appendClause.join(" ")}`, { ...appendDict });
}
