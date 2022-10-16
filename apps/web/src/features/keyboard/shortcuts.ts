import { curry } from "../../utils/functional/curry";

export type KeyboardShortcut = [
  keygram: string, // [Ctrl-][Alt-][Shift-]<Key>
  when: string,
  command: string
];

export const matchShortcutEvent = curry((shortcuts: KeyboardShortcut[], event: KeyboardEvent) => {
  const keygram = getKeygram(event);
  const command = shortcuts.find((shortcut) => shortcut[0] === keygram)?.[2];
  return command ? event : null;
});

export const getShortcutCommand = curry((shortcuts: KeyboardShortcut[], event: KeyboardEvent) => {
  const keygram = getKeygram(event);
  const command = shortcuts.find((shortcut) => shortcut[0] === keygram)?.[2];
  return command;
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
