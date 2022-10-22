import { emitCustom } from "../utils/dom/event";

declare global {
  interface WindowCustomEventMap {
    log: CustomEvent<{ message: string; level: Log.Level }>;
  }

  namespace Log {
    type Level = "debug" | "info" | "error";
  }
}

const log = (level: Log.Level, message: string) => emitCustom("log", { detail: { message, level } });

export const logDebug = log.bind(null, "debug");
export const logInfo = log.bind(null, "info");
export const logError = log.bind(null, "error");
