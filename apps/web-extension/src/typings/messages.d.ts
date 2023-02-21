import type { GitConnection } from "../modules/git/connection";
import type { GitHubConnection } from "../modules/git/github/operations";

export type MessageToWorker =
  | RequestActiveTabMatch
  | RequestCapture
  | RequestClear
  | RequestClone
  | RequestDownload
  | RequestPush
  | RequestRecent
  | RequestReset
  | RequestSync
  | RequestTextMatch
  | RequestTestConnection;

export type MessageToMain = RespondActiveTabMatch | RespondRecentNodes | RespondFileDownload | RespondMatchNodes;

export interface RequestActiveTabMatch {
  name: "request-active-tab-match";
  url: string;
}

export interface RequestCapture {
  name: "request-capture";
  url: string;
  targetUrls: string[];
  title: string;
  body: string;
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

export interface RequestPush {
  name: "request-push";
  connection: GitConnection;
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
  nodes: { title: string; url: string | null; targetUrls: string[]; body: string }[];
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
