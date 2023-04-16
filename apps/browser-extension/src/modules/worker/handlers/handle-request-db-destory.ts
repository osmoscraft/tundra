import type { DbWorkerHandler } from "./base";

export const handleDbDestory: DbWorkerHandler = async (context, message) => {
  if (!message.requestDbDestory) return;
  if (message.requestDbDestory.includes("fs")) {
    await context.syncService.clearHistory(); // fs destory implies sync service history clear
    await context.fileService.destory();
  }
  if (message.requestDbDestory.includes("sync")) {
    await context.syncService.destory();
  }
  context.respond(message, { respondDbDestroy: true });
};
