import { emit } from "../utils/dom/event";

declare global {
  interface WindowEventMap {
    log: CustomEvent<{ message: string; level: Log.Level }>;
  }

  namespace Log {
    type Level = "debug" | "info" | "error";
  }
}

const log = (level: Log.Level, message: string) => emit("log", { detail: { message, level } });

export const logDebug = log.bind(null, "debug");
export const logInfo = log.bind(null, "info");
export const logError = log.bind(null, "error");
