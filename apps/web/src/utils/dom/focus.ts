import { build } from "./builder";
import { off, on } from "./event";
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

const focusTrapState = new WeakMap<Node, { onFocusout: (...args: any) => any; cursorState: CursorState }>();

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

  const handleFocusout = (e: FocusEvent) => {
    if (!e.relatedTarget || !root.contains(e.relatedTarget as Node)) {
      autofocus(root);
    }
  };

  on("focusout", handleFocusout, root);

  console.log(document.activeElement);
  focusTrapState.set(root, {
    onFocusout: handleFocusout,
    cursorState: getCursorState(window),
  });
}

export function stopTrapFocus(root: ParentNode) {
  $$("[data-trap]", root).forEach((e) => e.remove());

  const state = focusTrapState.get(root);
  console.log(state);
  if (state?.cursorState) {
    off("focusout", state.onFocusout, root);
    restoreCursorState(window, state.cursorState);
  }
}

interface CursorState {
  element: Element | null;
  range: Range | null;
}
function getCursorState(window: Window): CursorState {
  const selection = window.getSelection();

  return {
    range: selection?.rangeCount === 0 ? null : selection?.getRangeAt(0) ?? null,
    element: window.document.activeElement,
  };
}

function restoreCursorState(window: Window, state: CursorState) {
  (state.element as HTMLElement)?.focus?.();
  if (state.range) {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(state.range);
  }
}
