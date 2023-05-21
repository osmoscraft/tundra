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
  localHash: string;
  localHashTime: string; // TODO `localHashTime`
  remoteHash: string;
  remoteHashTime: string;
  source: "local" | "remote" | "both"; // TOOD enum
  status: "removed" | "added" | "unchanged" | "modified" | "conflict"; // TODO enum
}
