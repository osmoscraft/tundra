import type { GithubConnection } from "../modules/sync/github/config-storage";

export type MessageToDbWorker = {
  notifyGithubConnection?: GithubConnection;
  requestAllDbDestroy?: boolean;
  requestFileDbDownload?: boolean;
  requestGithubConnection?: true;
  requestGithubImport?: true;
  requestTestConnection?: true;
};

export type MessageToMain = {
  notifyWorkerReady?: boolean;
  respondAllDbDestroy?: boolean;
  respondFileDbDownload?: File;
  respondGithubConnection?: GithubConnection | null;
  respondGithubImport?: boolean;
  respondTestConnection?: boolean;
};
