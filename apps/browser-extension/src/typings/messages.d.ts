import type { GithubConnection } from "../modules/sync/github/config-storage";

export type MessageToDbWorker = {
  requestDbDestroy?: boolean;
  requestDbDownload?: boolean;
  requestTestConnection?: GithubConnection;
};

export type MessageToMain = {
  notifyDbReady?: boolean;
  respondDbDestroy?: boolean;
  respondDbDownload?: File;
  respondTestConnection?: boolean;
};
