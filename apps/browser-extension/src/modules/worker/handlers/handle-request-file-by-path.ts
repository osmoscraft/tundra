import type { DbWorkerHandler } from "./base";

export const handleRequestFileByPath: DbWorkerHandler = async (context, message) => {
  if (!message.requestFileByPath) return;

  context.respond(message, { respondFileByPath: await context.fileService.read(message.requestFileByPath) });
};
