import type { GithubConnection } from "../modules/sync/github/config-storage";

export type MessageToDbWorker = {
  requestDbDestroy?: boolean;
  requestDbDownload?: boolean;
  requestGithubImport?: GithubConnection;
  requestTestConnection?: GithubConnection;
};

export type MessageToMain = {
  notifyDbReady?: boolean;
  respondDbDestroy?: boolean;
  respondDbDownload?: File;
  respondGithubImport?: boolean;
  respondTestConnection?: boolean;
};
