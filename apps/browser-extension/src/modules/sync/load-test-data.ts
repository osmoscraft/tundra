import { DbFileChangeSource, DbFileChangeStatus, type DbFileChange } from "./sql/schema";

export interface TestDataEntry {
  // omit the hash to indicate deletion
  file: Pick<DbFileChange, "path"> & Partial<DbFileChange>;
  expected: Pick<DbFileChange, "source" | "status">;
}

export function getSingleFileTestEntries(): TestDataEntry[] {
  return [
    {
      file: {
        path: "file-out-1",
        localHashTime: "1990-01-01T00:00:00",
      },
      expected: { source: DbFileChangeSource.Local, status: DbFileChangeStatus.Unchanged },
    },
    {
      file: {
        path: "file-out-2",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
      },
      expected: { source: DbFileChangeSource.Local, status: DbFileChangeStatus.Added },
    },
    {
      file: {
        path: "file-out-3",
        localHashTime: "1990-01-01T00:00:01",
        remoteHashTime: "1990-01-01T00:00:00",
      },
      expected: { source: DbFileChangeSource.Local, status: DbFileChangeStatus.Unchanged },
    },

    {
      file: {
        path: "file-out-4",
        localHashTime: "1990-01-01T00:00:01",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:00",
      },
      expected: { source: DbFileChangeSource.Local, status: DbFileChangeStatus.Added },
    },
    {
      file: {
        path: "file-out-5",
        localHashTime: "1990-01-01T00:00:01",

        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: DbFileChangeSource.Local, status: DbFileChangeStatus.Removed },
    },
    {
      file: {
        path: "file-out-6",
        localHashTime: "1990-01-01T00:00:01",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: DbFileChangeSource.Local, status: DbFileChangeStatus.Unchanged },
    },
    {
      file: {
        path: "file-out-7",
        localHashTime: "1990-01-01T00:00:01",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash2",
      },
      expected: { source: DbFileChangeSource.Local, status: DbFileChangeStatus.Modified },
    },

    {
      file: {
        path: "file-in-1",
        remoteHashTime: "1990-01-01T00:00:00",
      },
      expected: { source: DbFileChangeSource.Remote, status: DbFileChangeStatus.Unchanged },
    },
    {
      file: {
        path: "file-in-2",
        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: DbFileChangeSource.Remote, status: DbFileChangeStatus.Added },
    },
    {
      file: {
        path: "file-in-3",
        localHashTime: "1990-01-01T00:00:00",
        remoteHashTime: "1990-01-01T00:00:01",
      },
      expected: { source: DbFileChangeSource.Remote, status: DbFileChangeStatus.Unchanged },
    },
    {
      file: {
        path: "file-in-4",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:01",
      },
      expected: { source: DbFileChangeSource.Remote, status: DbFileChangeStatus.Removed },
    },
    {
      file: {
        path: "file-in-5",
        localHashTime: "1990-01-01T00:00:00",
        remoteHashTime: "1990-01-01T00:00:01",
        remoteHash: "hash",
      },
      expected: { source: DbFileChangeSource.Remote, status: DbFileChangeStatus.Added },
    },
    {
      file: {
        path: "file-in-6",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:01",
        remoteHash: "hash",
      },
      expected: { source: DbFileChangeSource.Remote, status: DbFileChangeStatus.Unchanged },
    },
    {
      file: {
        path: "file-in-7",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:01",
        remoteHash: "hash2",
      },
      expected: { source: DbFileChangeSource.Remote, status: DbFileChangeStatus.Modified },
    },

    {
      file: { path: "file-mixed-1" },
      expected: { source: DbFileChangeSource.Both, status: DbFileChangeStatus.Unchanged },
    },
    {
      file: {
        path: "file-mixed-2",
        localHashTime: "1990-01-01T00:00:00",
        remoteHashTime: "1990-01-01T00:00:00",
      },
      expected: { source: DbFileChangeSource.Both, status: DbFileChangeStatus.Unchanged },
    },
    {
      file: {
        path: "file-mixed-3",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:00",
      },
      expected: { source: DbFileChangeSource.Both, status: DbFileChangeStatus.Conflict },
    },
    {
      file: {
        path: "file-mixed-4",
        localHashTime: "1990-01-01T00:00:00",
        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: DbFileChangeSource.Both, status: DbFileChangeStatus.Conflict },
    },
    {
      file: {
        path: "file-mixed-5",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: DbFileChangeSource.Both, status: DbFileChangeStatus.Unchanged },
    },
    {
      file: {
        path: "file-mixed-6",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash2",
      },
      expected: { source: DbFileChangeSource.Both, status: DbFileChangeStatus.Conflict },
    },
  ];
}
