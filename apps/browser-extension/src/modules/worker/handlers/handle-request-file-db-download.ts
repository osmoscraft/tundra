import type { DbWorkerHandler } from "./base";

export const handleRequestFileDbDownload: DbWorkerHandler = async (context, message) => {
  if (!message.requestFileDbDownload) return;
  const dbFile = await context.fileService.getOpfsFile();
  context.respond(message, { respondFileDbDownload: dbFile });
};
