import type { DbFileChange } from "./sql/schema";

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
      expected: { source: "local", status: "unchanged" },
    },
    {
      file: {
        path: "file-out-2",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
      },
      expected: { source: "local", status: "added" },
    },
    {
      file: {
        path: "file-out-3",
        localHashTime: "1990-01-01T00:00:01",
        remoteHashTime: "1990-01-01T00:00:00",
      },
      expected: { source: "local", status: "unchanged" },
    },

    {
      file: {
        path: "file-out-4",
        localHashTime: "1990-01-01T00:00:01",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:00",
      },
      expected: { source: "local", status: "added" },
    },
    {
      file: {
        path: "file-out-5",
        localHashTime: "1990-01-01T00:00:01",

        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: "local", status: "removed" },
    },
    {
      file: {
        path: "file-out-6",
        localHashTime: "1990-01-01T00:00:01",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: "local", status: "unchanged" },
    },
    {
      file: {
        path: "file-out-7",
        localHashTime: "1990-01-01T00:00:01",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash2",
      },
      expected: { source: "local", status: "modified" },
    },

    {
      file: {
        path: "file-in-1",
        remoteHashTime: "1990-01-01T00:00:00",
      },
      expected: { source: "remote", status: "unchanged" },
    },
    {
      file: {
        path: "file-in-2",
        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: "remote", status: "added" },
    },
    {
      file: {
        path: "file-in-3",
        localHashTime: "1990-01-01T00:00:00",
        remoteHashTime: "1990-01-01T00:00:01",
      },
      expected: { source: "remote", status: "unchanged" },
    },
    {
      file: {
        path: "file-in-4",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:01",
      },
      expected: { source: "remote", status: "removed" },
    },
    {
      file: {
        path: "file-in-5",
        localHashTime: "1990-01-01T00:00:00",
        remoteHashTime: "1990-01-01T00:00:01",
        remoteHash: "hash",
      },
      expected: { source: "remote", status: "added" },
    },
    {
      file: {
        path: "file-in-6",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:01",
        remoteHash: "hash",
      },
      expected: { source: "remote", status: "unchanged" },
    },
    {
      file: {
        path: "file-in-7",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:01",
        remoteHash: "hash2",
      },
      expected: { source: "remote", status: "modified" },
    },

    {
      file: { path: "file-mixed-1" },
      expected: { source: "both", status: "unchanged" },
    },
    {
      file: {
        path: "file-mixed-2",
        localHashTime: "1990-01-01T00:00:00",
        remoteHashTime: "1990-01-01T00:00:00",
      },
      expected: { source: "both", status: "unchanged" },
    },
    {
      file: {
        path: "file-mixed-3",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:00",
      },
      expected: { source: "both", status: "conflict" },
    },
    {
      file: {
        path: "file-mixed-4",
        localHashTime: "1990-01-01T00:00:00",
        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: "both", status: "conflict" },
    },
    {
      file: {
        path: "file-mixed-5",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: "both", status: "unchanged" },
    },
    {
      file: {
        path: "file-mixed-6",
        localHashTime: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteHashTime: "1990-01-01T00:00:00",
        remoteHash: "hash2",
      },
      expected: { source: "both", status: "conflict" },
    },
  ];
}
