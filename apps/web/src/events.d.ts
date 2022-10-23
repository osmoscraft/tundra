declare global {
  interface WindowEventMap {
    "bar.toggle": Event;
    "command.exec": CustomEvent<string>;
    "config.open": Event;
    "log.append": CustomEvent<{ level: string; message: string }>;
    "menu.close": Event;
    "menu.open": Event;
  }
}
export {};
