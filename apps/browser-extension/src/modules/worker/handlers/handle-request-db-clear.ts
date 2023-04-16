import type { DbWorkerHandler } from "./base";

export const handleDbClear: DbWorkerHandler = async (context, message) => {
  if (!message.requestDbClear) return;
  if (message.requestDbClear.includes("fs")) {
    await context.syncService.clearHistory(); // fs clear implies sync service history clear
    await context.fileService.clear();
  }
  if (message.requestDbClear.includes("sync")) {
    await context.syncService.clearHistory();
  }
  context.respond(message, { respondDbDestroy: true });
};
