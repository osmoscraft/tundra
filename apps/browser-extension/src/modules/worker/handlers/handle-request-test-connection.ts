import type { DbWorkerHandler } from "./base";

export const handleRequestTestConnection: DbWorkerHandler = async (context, message) => {
  if (!message.requestTestConnection) return;
  const result = await context.syncService.testConnection();
  context.respond(message, { respondTestConnection: result });
};
