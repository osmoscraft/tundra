import type { DbWorkerHandler } from "./base";

export const handleRequestDbExport: DbWorkerHandler = async (context, message) => {
  if (!message.requestDbExport) return;
  switch (message.requestDbExport) {
    case "fs": {
      const dbFile = await context.fileService.getOpfsFile();
      context.respond(message, { respondFileDbDownload: dbFile });
      break;
    }
    case "sync": {
      const dbFile = await context.syncService.getOpfsFile();
      context.respond(message, { respondFileDbDownload: dbFile });
      break;
    }
  }
};
