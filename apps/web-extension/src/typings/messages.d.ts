export type MessageToWorker =
  | RequestCapture
  | RequestClear
  | RequestDownload
  | RequestRecent
  | RequestReset
  | RequestTextMatch;

export type MessageToMain = RecentNodesReady | FileDownloadReady | MatchNodesReady;

export interface RequestCapture {
  name: "request-capture";
  url: string;
  target_urls: string;
  title: string;
}

export interface RequestClear {
  name: "request-clear";
}

export interface RequestDownload {
  name: "request-download";
}

export interface RequestRecent {
  name: "request-recent";
}

export interface RequestReset {
  name: "request-reset";
}

export interface RequestTextMatch {
  name: "request-text-match";
  query: string;
}

export interface RecentNodesReady {
  name: "recent-nodes-ready";
  nodes: { title: string; url: string }[];
}

export interface MatchNodesReady {
  name: "match-nodes-ready";
  nodes: { title: string; url: string; html: string }[];
}

export interface FileDownloadReady {
  name: "file-download-ready";
  file: File;
}
