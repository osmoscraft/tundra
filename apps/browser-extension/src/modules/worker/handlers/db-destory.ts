import type { DbWorkerHandler } from "./base";

export const handleDbDestory: DbWorkerHandler = async (context, message) => {
  if (!message.requestDbDestroy) return;
  await context.fileService.destory();
  context.respond(message, { respondDbDestroy: true });
};
