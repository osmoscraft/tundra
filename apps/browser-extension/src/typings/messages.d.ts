import type { GithubConnection } from "../modules/sync/github/config-storage";

export type MessageToDbWorker = {
  notifyGithubConnection?: GithubConnection;
  requestDbDestory?: ("fs" | "sync")[];
  requestDbClear?: ("fs" | "sync")[];
  requestDbExport?: "fs" | "sync";
  requestGithubConnection?: true;
  requestGithubImport?: true;
  requestTestConnection?: true;
};

export type MessageToMain = {
  notifyWorkerReady?: boolean;
  respondDbClear?: boolean;
  respondDbDestroy?: boolean;
  respondFileDbDownload?: File;
  respondGithubConnection?: GithubConnection | null;
  respondGithubImport?: boolean;
  respondTestConnection?: boolean;
};
