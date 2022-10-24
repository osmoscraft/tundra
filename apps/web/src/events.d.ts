declare global {
  interface WindowEventMap {
    "action-bar.enter": Event;
    "action-bar.exit": Event;
    "command.exec": CustomEvent<string>;
    "command.request-match": CustomEvent<string>;
    "command.respond-match": CustomEvent<string[]>; // Must be emitted to the requesting event target
    "config.open": Event;
    "log.append": CustomEvent<{ level: string; message: string }>;
    "status-bar.toggle": Event;
    "status-bar.clear": Event;
  }
}
export {};
