import type { DbWorkerHandler } from "./base";

export const handleRequestDbDownload: DbWorkerHandler = async (context, message) => {
  if (!message.requestDbDownload) return;
  const dbFile = await context.tinyFS.getOpfsFile();
  context.respond(message, { respondDbDownload: dbFile });
};
