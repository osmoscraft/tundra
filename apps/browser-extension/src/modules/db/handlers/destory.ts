import type { DbWorkerHandler } from "./base";

export const handleDbDestory: DbWorkerHandler = (context, message) => {
  if (!message.requestDbDestroy) return;

  destoryDb(context.dbFilename);

  context.respond(message, { respondDbDestroy: true });
};

export async function destoryDb(filename: string) {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry(filename);
}
