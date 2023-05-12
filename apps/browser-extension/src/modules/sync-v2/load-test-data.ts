interface TestDataEntry {
  file: {
    path: string;
    localAt: string | null;
    remoteAt: string | null;
    localHash: string | null;
    remoteHash: string | null;
  };
  expected: {
    source: string;
    status: string;
  };
}

export function getTestDataEntries(): TestDataEntry[] {
  return [
    {
      file: { path: "file-out-1", localAt: "1990-01-01T00:00:00", localHash: null, remoteAt: null, remoteHash: null },
      expected: { source: "local", status: "unchanged" },
    },
    {
      file: {
        path: "file-out-2",
        localAt: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteAt: null,
        remoteHash: null,
      },
      expected: { source: "local", status: "added" },
    },
    {
      file: {
        path: "file-out-3",
        localAt: "1990-01-01T00:00:01",
        localHash: null,
        remoteAt: "1990-01-01T00:00:00",
        remoteHash: null,
      },
      expected: { source: "local", status: "unchanged" },
    },

    {
      file: {
        path: "file-out-4",
        localAt: "1990-01-01T00:00:01",
        localHash: "hash",
        remoteAt: "1990-01-01T00:00:00",
        remoteHash: null,
      },
      expected: { source: "local", status: "added" },
    },
    {
      file: {
        path: "file-out-5",
        localAt: "1990-01-01T00:00:01",
        localHash: null,
        remoteAt: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: "local", status: "removed" },
    },
    {
      file: {
        path: "file-out-6",
        localAt: "1990-01-01T00:00:01",
        localHash: "hash",
        remoteAt: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: "local", status: "unchanged" },
    },
    {
      file: {
        path: "file-out-7",
        localAt: "1990-01-01T00:00:01",
        localHash: "hash",
        remoteAt: "1990-01-01T00:00:00",
        remoteHash: "hash2",
      },
      expected: { source: "local", status: "modified" },
    },

    {
      file: { path: "file-in-1", localAt: null, localHash: null, remoteAt: "1990-01-01T00:00:00", remoteHash: null },
      expected: { source: "remote", status: "unchanged" },
    },
    {
      file: { path: "file-in-2", localAt: null, localHash: null, remoteAt: "1990-01-01T00:00:00", remoteHash: "hash" },
      expected: { source: "remote", status: "added" },
    },
    {
      file: {
        path: "file-in-3",
        localAt: "1990-01-01T00:00:00",
        localHash: null,
        remoteAt: "1990-01-01T00:00:01",
        remoteHash: null,
      },
      expected: { source: "remote", status: "unchanged" },
    },
    {
      file: {
        path: "file-in-4",
        localAt: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteAt: "1990-01-01T00:00:01",
        remoteHash: null,
      },
      expected: { source: "remote", status: "removed" },
    },
    {
      file: {
        path: "file-in-5",
        localAt: "1990-01-01T00:00:00",
        localHash: null,
        remoteAt: "1990-01-01T00:00:01",
        remoteHash: "hash",
      },
      expected: { source: "remote", status: "added" },
    },
    {
      file: {
        path: "file-in-6",
        localAt: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteAt: "1990-01-01T00:00:01",
        remoteHash: "hash",
      },
      expected: { source: "remote", status: "unchanged" },
    },
    {
      file: {
        path: "file-in-7",
        localAt: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteAt: "1990-01-01T00:00:01",
        remoteHash: "hash2",
      },
      expected: { source: "remote", status: "modified" },
    },

    {
      file: { path: "file-mixed-1", localAt: null, localHash: null, remoteAt: null, remoteHash: null },
      expected: { source: "both", status: "unchanged" },
    },
    {
      file: {
        path: "file-mixed-2",
        localAt: "1990-01-01T00:00:00",
        localHash: null,
        remoteAt: "1990-01-01T00:00:00",
        remoteHash: null,
      },
      expected: { source: "both", status: "unchanged" },
    },
    {
      file: {
        path: "file-mixed-3",
        localAt: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteAt: "1990-01-01T00:00:00",
        remoteHash: null,
      },
      expected: { source: "both", status: "conflict" },
    },
    {
      file: {
        path: "file-mixed-4",
        localAt: "1990-01-01T00:00:00",
        localHash: null,
        remoteAt: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: "both", status: "conflict" },
    },
    {
      file: {
        path: "file-mixed-5",
        localAt: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteAt: "1990-01-01T00:00:00",
        remoteHash: "hash",
      },
      expected: { source: "both", status: "unchanged" },
    },
    {
      file: {
        path: "file-mixed-6",
        localAt: "1990-01-01T00:00:00",
        localHash: "hash",
        remoteAt: "1990-01-01T00:00:00",
        remoteHash: "hash2",
      },
      expected: { source: "both", status: "conflict" },
    },
  ];
}
