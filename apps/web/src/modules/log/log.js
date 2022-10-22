import { emit } from "../../utils/dom/event";

export const logInfo = (message) => emit("log.append", { detail: { message, level: "info" } });
