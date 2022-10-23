import { build } from "./builder";
import { on } from "./event";
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

export function startFocusTrap(root: ParentNode) {
  const head = build("span")
    .attr({ "data-trap": "head", tabindex: "0" })
    .on({ focus: () => focusFirst(root) })
    .toNode();
  root.prepend(head);

  const tail = build("span")
    .attr({ "data-trap": "tail", tabindex: "0" })
    .on({ focus: () => focusLast(root) })
    .toNode();
  root.append(tail);

  on(
    "focusout",
    (e) => {
      if (!e.relatedTarget || !root.contains(e.relatedTarget as Node)) {
        autofocus(root);
      }
    },
    root
  );
}

export function stopTrapFocus(root: ParentNode) {
  $$("[data-trap]", root).forEach((e) => e.remove());
}
