declare global {
  interface WindowEventMap {
    "bar.toggle": Event;
    "log.append": CustomEvent<{ level: string; message: string }>;
    "menu.open": Event;
    "menu.close": Event;
    "config.open": Event;
    "command.exec": CustomEvent<string>;
  }
}
export {};
