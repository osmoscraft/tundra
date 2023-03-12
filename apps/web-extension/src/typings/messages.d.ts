import type { CaptureData } from "../modules/capture/capture-form-element";
import type { GithubConnection } from "../modules/sync/github/config-storage";

export type MessageToWorkerV2 = {
  requestCapture?: {
    githubConnection: GithubConnection;
    data: CaptureData;
  };
  requestDbClear?: boolean;
  requestDbDownload?: boolean;
  requestDbNodesByPaths?: string[];
  requestDbNodesRecent?: boolean;
  requestDbNuke?: boolean;
  requestDbSearch?: {
    query: string;
  };
  requestStatus?: boolean;
  requestGithubConnectionTest?: GithubConnection;
  requestGithubDownload?: GithubConnection;
  requestGithubPull?: GithubConnection;
};

export type MessageToMainV2 = {
  log?: string;
  respondCapture?: string;
  respondDbDownload?: File;
  respondDbNodesByPaths?: { path: string; content: any }[];
  respondDbNodesRecent?: { path: string; content: any }[];
  respondDbSearch?: { path: string; content: any }[];
  respondGithubConnectionTest?: {
    isSuccess: boolean;
  };
  respondGitHubPull?: {
    isSuccess: boolean;
    changeCount: number;
  };
};
