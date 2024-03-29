declare global {
  interface WindowEventMap {
    "action-bar.enter": Event;
    "action-bar.exit": Event;
    "command.exec": CustomEvent<string>;
    "command.request-match": CustomEvent<string>;
    "command.respond-match": CustomEvent<string[]>; // Must be emitted to the requesting event target
    "config.open-ui": Event;
    "config.request-json": Event;
    "config.respond-json": CustomEvent<any>; // Must be emitted to the requesting event target
    "log.append": CustomEvent<{ level: string; message: string }>;
    "status-bar.toggle": Event;
    "status-bar.clear": Event;
  }
}
export {};
