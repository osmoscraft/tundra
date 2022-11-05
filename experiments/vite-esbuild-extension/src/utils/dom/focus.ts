import { $, $$, off, on } from "utils";
import { build } from "./builder";

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

const focusTrapStateCache = new WeakMap<Node, (...args: any) => any>();

export function startFocusTrap(onDismiss: (target: EventTarget | null) => any, root: ParentNode) {
  const head = build("span")
    .attr({ "data-trap": "head", tabindex: "0" })
    .on({ focus: () => focusLast(root) })
    .toNode();
  root.prepend(head);

  const tail = build("span")
    .attr({ "data-trap": "tail", tabindex: "0" })
    .on({ focus: () => focusFirst(root) })
    .toNode();
  root.append(tail);

  const handleFocusout = (e: FocusEvent) => {
    // focus will transition to another node within the root
    if (root.contains(e.relatedTarget as Node)) return;

    // focus no longer within root but active element still in root
    // this happens e.g. when user going to another browser window
    if (containsActiveElement(root as Element)) return;

    onDismiss(document.activeElement);
  };

  on("focusout", handleFocusout, root);

  focusTrapStateCache.set(root, handleFocusout);
}

export function stopFocusTrap(root: ParentNode) {
  $$("[data-trap]", root).forEach((e) => e.remove());
  const handler = focusTrapStateCache.get(root);
  if (handler) {
    off("focusout", handler, root);
  }
}

const cursorStateCache = new WeakMap<Node, CursorState>();

export function cacheFocus(root: ParentNode) {
  const state = getCursorState(window);
  cursorStateCache.set(root, state);
}

export function restoreFocus(root: ParentNode) {
  const state = cursorStateCache.get(root);
  if (state) {
    restoreCursorState(window, state);
    forgetFocus(root);
  }
}

export function forgetFocus(root: ParentNode) {
  cursorStateCache.delete(root);
}

export function containsActiveElement(target: Element) {
  return target?.contains((target.getRootNode() as ShadowRoot | Document)?.activeElement);
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
