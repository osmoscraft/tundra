import type { DbWorkerHandler } from "./base";

export const handleRequestFileList: DbWorkerHandler = async (context, message) => {
  if (!message.requestFileList) return;

  const files = await context.fileService.list(10, 0);
  context.respond(message, { respondFileList: files });
};
