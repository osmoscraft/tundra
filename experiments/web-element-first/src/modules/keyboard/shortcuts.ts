/** Format: [Ctrl+][Alt+][Shift+]<Key> */
export function getKeygram(e: KeyboardEvent): string {
  return `${e.ctrlKey ? "Ctrl+" : ""}${e.altKey ? "Alt+" : ""}${e.shiftKey ? "Shift+" : ""}${normalizeKey(e.key)}`;
}

function normalizeKey(key: string) {
  switch (key) {
    case " ":
      return "Space";
    default:
      return `${key.slice(0, 1).toUpperCase()}${key.slice(1)}`;
  }
}
