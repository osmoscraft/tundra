import type { CaptureData } from "../modules/capture/capture-form-element";
import type { GithubConnection } from "../modules/sync/github/config-storage";

export type MessageToWorkerV2 = {
  requestCapture?: {
    githubConnection: GithubConnection;
    data: CaptureData;
  };
  requestDbClear?: boolean;
  requestDbDownload?: boolean;
  requestDbNuke?: boolean;
  requestStatus?: boolean;
  requestGithubConnectionTest?: GithubConnection;
  requestGithubDownload?: GithubConnection;
};

export type MessageToMainV2 = {
  log?: string;
  respondCapture?: string;
  respondDbDownload?: File;
  respondGithubConnectionTest?: {
    isSuccess: boolean;
  };
};
