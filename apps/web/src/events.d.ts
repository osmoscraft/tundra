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
    "db.request-tx": CustomEvent<{ tid: number; tname: string; targs?: any[]; src: EventTarget }>;
    "db.respond-tx": CustomEvent<{ tid: number; result: any }>; // Must be emitted to src
    "fs.test-remote": CustomEvent<any>;
    "log.append": CustomEvent<{ level: string; message: string }>;
    "status-bar.toggle": Event;
    "status-bar.clear": Event;
  }
}
export {};
