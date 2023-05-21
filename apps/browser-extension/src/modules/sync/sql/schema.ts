export interface DbGithubConnection {
  owner: string | null;
  repo: string | null;
  token: string;
}

export interface DbGithubRef {
  id: string;
}

export interface DbFileChange {
  path: string;
  localAt: string; // TODO `localHashTime`
  localHash: string;
  remoteAt: string;
  remoteHash: string;
  source: "local" | "remote" | "both"; // TOOD enum
  status: "removed" | "added" | "unchanged" | "modified" | "conflict"; // TODO enum
}
