import { copyLineDown, copyLineUp, indentLess, indentMore, moveLineDown, moveLineUp } from "@codemirror/commands";
import type { KeyBinding } from "@codemirror/view";

export const blockMovementKeymap: KeyBinding[] = [
  { key: "Alt-k", run: moveLineUp },
  { key: "Shift-Alt-k", run: copyLineUp },

  { key: "Alt-j", run: moveLineDown },
  { key: "Shift-Alt-j", run: copyLineDown },

  { key: "Alt-h", run: indentLess },
  { key: "Alt-l", run: indentMore },
];
