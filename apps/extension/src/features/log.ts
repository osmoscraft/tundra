export interface LogEntry {
  message: string;
  type: "info" | "error";
}

export interface Logger {
  info: (message: string) => any;
  error: (message: string) => any;
}

export function getLogger(eventTarget: EventTarget): Logger {
  const logInternal = (type: "info" | "error", message: string) =>
    eventTarget.dispatchEvent(
      new CustomEvent("log", {
        detail: {
          message,
          type,
        },
      })
    );

  return {
    info: logInternal.bind(null, "info"),
    error: logInternal.bind(null, "error"),
  };
}
