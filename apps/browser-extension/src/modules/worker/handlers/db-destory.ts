import type { DbWorkerHandler } from "./base";

export const handleDbDestory: DbWorkerHandler = async (context, message) => {
  if (!message.requestDbDestroy) return;
  await context.tinyFS.destory();
  context.respond(message, { respondDbDestroy: true });
};
