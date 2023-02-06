export type MessageToWorker = RequestCapture | RequestClear | RequestDownload | RequestRecent | RequestReset;
export type MessageToMain = RecentNodesReady | FileDownloadReady;

export interface RequestCapture {
  name: "request-capture";
  urls: string;
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

export interface RecentNodesReady {
  name: "recent-nodes-ready";
  nodes: { title: string; urls }[];
}

export interface FileDownloadReady {
  name: "file-download-ready";
  file: File;
}
