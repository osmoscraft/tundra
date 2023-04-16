import type { DbWorkerHandler } from "./base";

export const handleRequestFileList: DbWorkerHandler = async (context, message) => {
  if (!message.requestFileList) return;

  context.respond(message, { respondFileList: await context.fileService.list(10, 0) });
};
