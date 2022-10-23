import { getKeygram } from "../../utils/dom/keyboard";

export type Shortcut = [keygram: string, handler: (e: KeyboardEvent) => any];

export const runShortcut = (shortcuts: Shortcut[], e: KeyboardEvent) => {
  const actual = getKeygram(e);
  shortcuts.forEach(([expected, handler]) => actual === expected && handler(e));
  return e;
};
