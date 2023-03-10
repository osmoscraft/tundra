import type { GithubConnection } from "../modules/sync/github/config-storage";

export type MessageToWorkerV2 = {
  requestCapture?: CaptureData;
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
