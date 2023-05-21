export interface GithubConnection {
  owner: string | null;
  repo: string | null;
  token: string;
}

export interface GithubRef {
  id: string;
}

export interface FileChange {
  path: string;
  localAt: string; // TODO `localHashTime`
  localHash: string;
  remoteAt: string;
  remoteHash: string;
  source: "local" | "remote" | "both"; // TOOD enum
  status: "removed" | "added" | "unchanged" | "modified" | "conflict"; // TODO enum
}
