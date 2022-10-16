import { curry } from "../../utils/functional/curry";

export type Shortcut = [
  keygram: string,
  /** Not implemented */
  context: string,
  handler: (e: KeyboardEvent) => any
];

export const handleKeydownWithShortcut = curry((shortcuts: Shortcut[], event: KeyboardEvent) => {
  const keygram = getKeygram(event);
  shortcuts.find((shortcut) => shortcut[0] === keygram)?.[2](event);
  return event;
});

/** Format: [Ctrl-][Alt-][Shift-]keyCode */
function getKeygram(e: KeyboardEvent): string {
  return `${e.ctrlKey ? "Ctrl-" : ""}${e.altKey ? "Alt-" : ""}${e.shiftKey ? "Shift-" : ""}${normalizeKey(e.key)}`;
}

function normalizeKey(key: string) {
  switch (key) {
    case " ":
      return "Space";
    default:
      return `${key.slice(0, 1).toUpperCase()}${key.slice(1)}`;
  }
}
