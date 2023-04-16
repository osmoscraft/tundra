import type { TinyFile } from "../modules/fs";
import type { GithubConnection } from "../modules/sync";

export type MessageToDbWorker = {
  notifyGithubConnection?: GithubConnection;
  requestDbClear?: ("fs" | "sync")[];
  requestDbDestory?: ("fs" | "sync")[];
  requestDbExport?: "fs" | "sync";
  requestGithubConnection?: true;
  requestGithubImport?: true;
  requestFileByPath?: string;
  requestFileList?: true;
  requestTestConnection?: true;
};

export type MessageToMain = {
  notifyWorkerReady?: boolean;
  respondDbClear?: boolean;
  respondDbDestroy?: boolean;
  respondDbExport?: File;
  respondGithubConnection?: GithubConnection | null;
  respondGithubImport?: boolean;
  respondFileList?: TinyFile[];
  respondFileByPath?: TinyFile;
  respondTestConnection?: boolean;
};
