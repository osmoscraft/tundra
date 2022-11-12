import { emit, preventDefault } from "../../utils/event";
import { shortPipe } from "../../utils/functional/pipe";
import { when } from "../../utils/functional/when";

/**
 * Format `[Ctrl+][Alt+][Shift+]<Key>`
 * @example
 * // Ctrl+K
 * // Ctrl+Shit+Space
 * // Alt+`
 */
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

export type Shortcut = [command: string, when?: string];

export const handleShortcuts = (shortcuts: Shortcut[]) =>
  shortPipe(
    when(
      shortPipe(
        getKeygram,
        (key: string) => shortcuts.find((item) => item[0] === key)?.[1],
        (cmd: string) => emit("shell.execCommand", { detail: cmd as any })(window)
      ),
      preventDefault
    )
  );
