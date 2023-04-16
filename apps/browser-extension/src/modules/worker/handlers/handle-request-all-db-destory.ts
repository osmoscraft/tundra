import type { DbWorkerHandler } from "./base";

export const handleAllDbDestory: DbWorkerHandler = async (context, message) => {
  if (!message.requestAllDbDestroy) return;
  await Promise.all([context.fileService.destory(), context.syncService.destory()]);
  context.respond(message, { respondAllDbDestroy: true });
};
