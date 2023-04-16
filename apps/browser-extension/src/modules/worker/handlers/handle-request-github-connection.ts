import type { DbWorkerHandler } from "./base";

export const handleRequestGithubConnection: DbWorkerHandler = async (context, message) => {
  if (!message.requestGithubConnection) return;
  const result = await context.syncService.getConnection();
  context.respond(message, { respondGithubConnection: result });
};
