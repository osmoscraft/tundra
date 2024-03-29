import { array } from "@tundra/fp-utils";
import { paramsToBindings } from "@tundra/sqlite-utils";
import * as fileApi from "./file";
import { decodeMeta, encodeMeta } from "./meta";
import { DbFileStatus, type DbWritableFile } from "./schema";

export interface GraphWritableSource {
  path: string;
  content: string | null;
  updatedAt?: number | null;
}

export interface GraphReadableSource {
  path: string;
  content: string | null;
  updatedAt: number | null;
}

export function commit(db: Sqlite3.DB, files: GraphWritableSource | GraphWritableSource[]) {
  const now = Date.now();
  fileApi.updateFiles(
    db,
    array(files).map((file) => serializeGraphSourceToDbFile(file, now, "local"))
  );
}

export function fetch(db: Sqlite3.DB, files: GraphWritableSource | GraphWritableSource[]) {
  const now = Date.now();
  fileApi.updateFiles(
    db,
    array(files).map((file) => serializeGraphSourceToDbFile(file, now, "remote"))
  );
}

export function clone(db: Sqlite3.DB, files: GraphWritableSource | GraphWritableSource[]) {
  const now = Date.now();
  fileApi.updateFiles(
    db,
    array(files).map((file) => serializeGraphSourceToDbFile(file, now, "synced"))
  );
}

export interface MergeInput {
  paths?: string[];
  ignore?: string[];
}
export function merge(db: Sqlite3.DB, input: MergeInput) {
  const files = fileApi.listFiles(db, {
    paths: input.paths,
    ignore: input.ignore,
    filters: [["status", "=", DbFileStatus.Behind]],
  });

  // move remote into synced
  fileApi.updateFiles(
    db,
    files.map((file) => ({ path: file.path, synced: file.remote }))
  );
}

export interface PushInput {
  paths?: string[];
  ignore?: string[];
}
export function push(db: Sqlite3.DB, input: PushInput) {
  const files = fileApi.listFiles(db, {
    paths: input.paths,
    ignore: input.ignore,
    filters: [["status", "=", DbFileStatus.Ahead]],
  });

  // move local into synced
  fileApi.updateFiles(
    db,
    files.map((file) => ({ path: file.path, synced: file.local }))
  );
}

export interface ResolveInput {
  paths?: string[];
  ignore?: string[];
}
export function resolve(db: Sqlite3.DB, input: ResolveInput) {
  const files = fileApi.listFiles(db, {
    paths: input.paths,
    ignore: input.ignore,
    filters: [["status", "=", DbFileStatus.Conflict]],
  });

  // Goal: acknowledge older version as synced, and newer version as change on top of it
  // For each conflict file (guaranteed to have both local and remote):
  // set synced to remote if local.updatedAt >= remote.updatedAt
  // set synced to local if remote.content if local.updatedAt < remote.updatedAt

  const sql = `
WITH ConflictList(value) AS (
  SELECT json_each.value FROM json_each(json(:filePaths))
)
UPDATE File
SET synced = CASE
  WHEN (local ->> '$.updatedAt') >= (remote ->> '$.updatedAt') THEN remote ELSE local
END
WHERE EXISTS (
  SELECT 1
  FROM ConflictList
  WHERE File.Path = ConflictList.value
);
  `;

  const bind = paramsToBindings(sql, { filePaths: JSON.stringify(files.map((f) => f.path)) });
  db.exec(sql, { bind });
}

export function untrack(db: Sqlite3.DB, patterns: string[]) {
  fileApi.removeFiles(db, patterns);
}

export function getFile(db: Sqlite3.DB, path: string) {
  const file = fileApi.getFile(db, path);
  if (!file) return undefined;

  return decodeMeta(file);
}

export interface RecentFilesInput {
  limit: number;
  paths?: string[];
  ignore?: string[];
}
export function getRecentFiles(db: Sqlite3.DB, input: RecentFilesInput) {
  const files = fileApi.listFiles(db, {
    paths: input.paths,
    ignore: input.ignore,
    orderBy: [["updatedAt", "DESC"]],
    limit: input.limit,
  });
  return files.map(decodeMeta);
}

export interface GetFilesInput {
  paths?: string[];
  ignore?: string[];
}

export function getDirtyFiles(db: Sqlite3.DB, input?: GetFilesInput) {
  return fileApi.listFiles(db, {
    filters: [["status", "!=", DbFileStatus.Synced]],
    paths: input?.paths,
    ignore: input?.ignore,
  });
}

export function getFiles(db: Sqlite3.DB, input?: GetFilesInput) {
  return fileApi.listFiles(db, {
    paths: input?.paths,
    ignore: input?.ignore,
  });
}

export function getFileCount(db: Sqlite3.DB, input?: GetFilesInput) {
  return fileApi.getFileCount(db, {
    paths: input?.paths,
    ignore: input?.ignore,
  });
}

export interface GetStatusSummaryInput {
  paths?: string[];
  ignore?: string[];
}

export interface SyncStats {
  ahead: number;
  behind: number;
  conflict: number;
  total: number;
}

export function getSyncStats(db: Sqlite3.DB, input?: GetStatusSummaryInput): SyncStats {
  const total = getFileCount(db, input);

  return getDirtyFiles(db, input).reduce(
    (acc, file) => {
      if (file.status === DbFileStatus.Ahead) {
        acc.ahead++;
      } else if (file.status === DbFileStatus.Behind) {
        acc.behind++;
      } else if (file.status === DbFileStatus.Conflict) {
        acc.conflict++;
      }
      return acc;
    },
    {
      ahead: 0,
      behind: 0,
      conflict: 0,
      total,
    }
  );
}

export interface SearchFilesInput {
  query: string;
  limit: number;
  paths?: string[];
  ignore?: string[];
}
export function searchFiles(db: Sqlite3.DB, input: SearchFilesInput) {
  const files = fileApi.searchFiles(db, {
    query: input.query,
    limit: input.limit,
    paths: input.paths,
    ignore: input.ignore,
  });
  return files.map(decodeMeta);
}

export function serializeGraphSourceToDbFile(
  graphSource: GraphWritableSource,
  now: number,
  dbSourceType: "local" | "remote" | "synced"
): DbWritableFile {
  return {
    path: graphSource.path,
    [dbSourceType]: JSON.stringify({
      content: graphSource.content,
      meta: encodeMeta(graphSource),
      updatedAt: graphSource.updatedAt === undefined ? now : graphSource.updatedAt,
    }),
  };
}

export interface GetFileByMetaUrlInput {
  url: string;
  limit: number;
  /** Max number of matches with false positives, default to 10_000 */
  maxPreliminaryMatch?: number;
  paths?: string[];
  ignore?: string[];
}
export function searchFilesByMetaUrl(db: Sqlite3.DB, input: GetFileByMetaUrlInput) {
  const foundFiles = searchFiles(db, {
    query: `"url: ${input.url}"`,
    limit: input.maxPreliminaryMatch ?? 10_000,
    paths: input.paths,
    ignore: input.ignore,
  });

  const preciseMatch = foundFiles.filter((file) => file.meta?.url === input.url);
  return preciseMatch;
}
