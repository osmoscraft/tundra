/** Format: [Ctrl-][Alt-][Shift-]keyCode */
export function getKeyCodeString(e: KeyboardEvent): string {
  return `${e.ctrlKey ? "Ctrl-" : ""}${e.altKey ? "Alt-" : ""}${e.shiftKey ? "Shift-" : ""}${e.code}`;
}
