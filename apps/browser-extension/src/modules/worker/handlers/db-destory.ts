import type { DbWorkerHandler } from "./base";

export const handleDbDestory: DbWorkerHandler = async (context, message) => {
  if (!message.requestDbDestroy) return;
  await Promise.all([context.fileService.destory(), context.syncService.destory()]);
  context.respond(message, { respondDbDestroy: true });
};
