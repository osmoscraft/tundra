import type { DbWorkerHandler } from "./base";

export const handleRequestDownload: DbWorkerHandler = async (context, message) => {
  if (!message.requestDbDownload) return;

  const dbFile = await getDbFile(context.dbFilename);

  context.respond(message, { respondDbDownload: dbFile });
};

async function getDbFile(filename: string) {
  const root = await navigator.storage.getDirectory();
  const dbFileHandle = await root.getFileHandle(filename);
  const file = await dbFileHandle.getFile();
  return file;
}
