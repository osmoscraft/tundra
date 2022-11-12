import { emit } from "utils";

export const logInfo = (message: string) => emit("log.append", { detail: { level: "info", message } });
export const logError = (message: string) => emit("log.append", { detail: { level: "error", message } });
