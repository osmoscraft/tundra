declare global {
  interface WindowEventMap {
    "action-bar.focus": Event;
    "command.exec": CustomEvent<string>;
    "config.open": Event;
    "log.append": CustomEvent<{ level: string; message: string }>;
    "menu.close": Event;
    "menu.open": Event;
    "status-bar.toggle": Event;
    "status-bar.clear": Event;
  }
}
export { };

