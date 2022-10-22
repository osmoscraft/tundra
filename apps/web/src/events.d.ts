declare global {
  interface WindowEventMap {
    "bar.toggle": Event;
    "log.append": CustomEvent<{ level: string; message: string }>;
  }
}
export {};
