import type { GithubConnection } from "../modules/sync/github/config-storage";

export type MessageToDbWorker = {
  notifyGithubConnection?: GithubConnection;
  requestDbClear?: ("fs" | "sync")[];
  requestDbDestory?: ("fs" | "sync")[];
  requestDbExport?: "fs" | "sync";
  requestGithubConnection?: true;
  requestGithubImport?: true;
  requestTestConnection?: true;
};

export type MessageToMain = {
  notifyWorkerReady?: boolean;
  respondDbClear?: boolean;
  respondDbDestroy?: boolean;
  respondDbExport?: File;
  respondGithubConnection?: GithubConnection | null;
  respondGithubImport?: boolean;
  respondTestConnection?: boolean;
};
