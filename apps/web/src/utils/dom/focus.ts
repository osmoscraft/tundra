import { on } from "./event";
import { element } from "./factory";
import { $, $$ } from "./query";

export const autofocus = (root: ParentNode) => ($<HTMLElement>("[autofocus]", root) ?? focusable(root)[0])?.focus();

export const focusFirst = (root: ParentNode) => focusable(root)[0]?.focus();
export const focusLast = (root: ParentNode) => focusable(root).pop()?.focus();

export function focusable(root: ParentNode) {
  return [
    ...root.querySelectorAll<HTMLElement>(
      ':where(a[href], button, input, textarea, select, details, [tabindex]):not([tabindex="-1"],[disabled],[aria-hidden],[data-trap])'
    ),
  ];
}

export function trapFocus(root: ParentNode) {
  const head = element("span");
  head.tabIndex = 0;
  head.setAttribute("data-trap", "head");
  on("focus", () => focusFirst(root), head);
  root.prepend(head);

  const tail = element("span");
  tail.tabIndex = 0;
  tail.setAttribute("data-trap", "tail");
  on("focus", () => focusLast(root), tail);
  root.append(tail);
}

export function stopTrapFocus(root: ParentNode) {
  $$("[data-trap]", root).forEach((e) => e.remove());
}
