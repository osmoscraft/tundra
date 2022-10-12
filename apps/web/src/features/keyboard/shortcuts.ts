export type Shortcut = [
  keygram: string,
  /** Not implemented */
  context: string,
  handler: (e: KeyboardEvent) => any
];

export function handleKeydownWithShortcut(shortcuts: Shortcut[], event: KeyboardEvent) {
  const keygram = getKeygram(event);
  shortcuts.find((shortcut) => shortcut[0] === keygram)?.[2](event);
  return event;
}

/** Format: [Ctrl-][Alt-][Shift-]keyCode */
function getKeygram(e: KeyboardEvent): string {
  return `${e.ctrlKey ? "Ctrl-" : ""}${e.altKey ? "Alt-" : ""}${e.shiftKey ? "Shift-" : ""}${e.code}`;
}
