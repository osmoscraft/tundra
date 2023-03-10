import type { GitConnection } from "../modules/sync/connection";
import type { GithubConnection } from "../modules/sync/github/config-storage";

export type MessageToWorker =
  | RequestActiveTabMatch
  | RequestNodeCapture
  | RequestClear
  | RequestClone
  | RequestDownload
  | RequestRecent
  | RequestReset
  | RequestSync
  | RequestTextMatch
  | RequestTestConnection;

export type MessageToWorkerV2 = {
  requestDbClear?: boolean;
  requestDbDownload?: boolean;
  requestDbNuke?: boolean;
  requestStatus?: boolean;
  requestGithubConnectionTest?: GithubConnection;
  requestGithubDownload?: GithubConnection;
};

export type MessageToMainV2 = {
  log?: string;
  respondGithubConnectionTest?: {
    isSuccess: boolean;
  };
  respondDbDownload?: File;
};

export interface RequestActiveTabMatch {
  name: "request-active-tab-match";
  url: string;
}

export interface RequestClear {
  name: "request-clear";
}

export interface RequestClone {
  name: "request-clone";
  connection: GitConnection;
}

export interface RequestDownload {
  name: "request-download";
}

export interface RequestNodeCapture {
  name: "request-node-capture";
  url: string;
  targetUrls: string[];
  title: string;
  note: string;
}

export interface RequestRecent {
  name: "request-recent";
}

export interface RequestReset {
  name: "request-reset";
}

export interface RequestSync {
  name: "request-sync";
  connection: GitConnection;
}

export interface RequestTestConnection {
  name: "request-test-connection";
  connection: GitHubConnection;
}

export interface RequestTextMatch {
  name: "request-text-match";
  query: string;
}

export interface RespondActiveTabMatch {
  name: "respond-active-tab-match";
  nodes: { id: string; note: string; title: string; url: string | null; targetUrls: string[] }[];
}

export interface RespondRecentNodes {
  name: "respond-recent-nodes";
  nodes: { title: string; url: string | null }[];
}

export interface RespondMatchNodes {
  name: "respond-match-nodes";
  nodes: { title: string; url: string | null; html: string }[];
}

export interface RespondFileDownload {
  name: "respond-file-download";
  file: File;
}
