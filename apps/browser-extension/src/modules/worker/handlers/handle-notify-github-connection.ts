import type { DbWorkerHandler } from "./base";

export const handleNotifyGithubConnection: DbWorkerHandler = async (context, message) => {
  if (!message.notifyGithubConnection) return;
  context.syncService.setConnection(message.notifyGithubConnection);
};
