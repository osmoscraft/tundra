import type { CaptureRequest } from "../modules/capture/capture-form-element";
import type { GraphStats } from "../modules/graph/get-graph-stats";
import type { GithubConnection } from "../modules/sync/github/config-storage";

export type MessageToWorkerV2 = {
  requestCapture?: {
    githubConnection: GithubConnection;
    node: CaptureRequest["node"];
    isUpdate: boolean;
  };
  requestDbClear?: boolean;
  requestDbDownload?: boolean;
  requestDbNodesByPaths?: string[];
  requestDbNodesRecent?: boolean;
  requestDbNodesByUrls?: string[];
  requestDbNuke?: boolean;
  requestDbSearch?: {
    query: string;
  };
  requestGraphStats?: {
    url: string;
    linkUrls: string[];
  };
  requestStatus?: boolean;
  requestGithubConnectionTest?: GithubConnection;
  requestGithubDownload?: GithubConnection;
  requestGithubPull?: GithubConnection;
};

export type MessageToMainV2 = {
  log?: string;
  respondCapture?: string;
  respondCaptureUpdate?: string;
  respondDbDownload?: File;
  respondDbNodesByPaths?: { path: string; content: any }[];
  respondDbNodesRecent?: { path: string; content: any }[];
  respondDbNodesByUrls?: { path: string; content: any }[];
  respondDbSearch?: { path: string; content: any }[];
  respondGithubConnectionTest?: {
    isSuccess: boolean;
  };
  respondGitHubPull?: {
    isSuccess: boolean;
    changeCount: number;
  };
  respondGraphStats?: GraphStats;
};
