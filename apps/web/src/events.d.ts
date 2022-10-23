declare global {
  interface WindowEventMap {
    "bar.toggle": Event;
    "log.append": CustomEvent<{ level: string; message: string }>;
    "menu.open": Event;
    "modal.open": CustomEvent<DocumentFragment | string>;
  }
}
export {};
