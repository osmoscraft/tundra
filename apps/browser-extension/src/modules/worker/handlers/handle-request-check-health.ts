import { testFileSystemCreation } from "../../file-system/index.test";
import type { DbWorkerHandler } from "./base";

export const handleRequestCheckHealth: DbWorkerHandler = async (context, message) => {
  if (!message.requestCheckHealth) return;

  try {
    await testFileSystemCreation();
    context.respond(message, { respondCheckHealth: { ok: true } });
  } catch (e: any) {
    console.error(e);
    context.respond(message, { respondCheckHealth: { ok: false, error: e?.message ?? e?.name } });
  }
};
