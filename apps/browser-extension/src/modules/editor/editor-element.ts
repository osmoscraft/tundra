import { getCombo } from "@tinykb/dom-utils";
import type { Fn } from "@tinykb/fp-utils";
import { htmlToMarkdown, markdownToHtml } from "./codec";
import "./editor-element.css";

export type Keymap = Record<string, Fn | undefined>;

export class EditorElement extends HTMLElement {
  focus() {
    this.querySelector<HTMLElement>("[contenteditable]")?.focus();
  }

  setKeymap(keymap: Keymap) {
    const wrappedHandler = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      const keyCombo = getCombo(e);
      const matchedHandler = keymap[keyCombo];
      if (matchedHandler) {
        e.preventDefault();
        matchedHandler();
      }
    };

    this.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      console.log("==============");
      console.log("[1] keydown", e);
      // handle commands: move, link, undo/redo
    });
    this.addEventListener("compositionstart", (e) => {
      console.log("[2] compositionstart", e);
      // noop
    });
    this.addEventListener("copy", (e) => {
      console.log("[3.a] copy", e);
      // handle pre-copy formatting
    });
    this.addEventListener("paste", (e) => {
      console.log("[3.b] paste", e);
      // mark dirty lines
      // format pasted content
    });
    this.addEventListener("cut", (e) => {
      console.log("[3.c] cut", e);
      // mark dirty lines
      // format pasted content
    });
    this.addEventListener("beforeinput", (e) => {
      if (e.isComposing) return;
      console.log("[4] beforeinput", e);
      // mark dirty lines
    });
    this.addEventListener("input", (e) => {
      if ((e as InputEvent).isComposing) return;
      console.log("[5] input", e);
      // noop
    });
    this.addEventListener("compositionend", (e) => {
      console.log("[6] compositionend", e);
      // noop
    });
    this.addEventListener("keyup", (e) => {
      if (e.isComposing) return;
      console.log("[7] keyup", e);
      wrappedHandler(e);
      // note: lots of noise events from IME and dialog manager
    });

    // this.addEventListener("keydown", wrappedHandler);

    // TODO: find a way to actually remove the event listeners
    return () => this.removeEventListener("keydown", wrappedHandler);
  }

  setMarkdown(markdown: string) {
    this.innerHTML = /*html*/ `<div contenteditable="true">${markdownToHtml(markdown)}</div>`;
  }

  getMarkdown() {
    return htmlToMarkdown(this.children[0].innerHTML);
  }

  indentRelative = (levels: number) =>
    getLines(getBracket(window.getSelection())).map(indentLineRelative.bind(null, levels));

  moveUp() {
    const [head, tail] = getBracket(window.getSelection());
    const beforeHead = (head?.previousElementSibling as HTMLElement) ?? null;
    swapTo("afterend", tail, beforeHead);
  }

  moveDown() {
    const [head, tail] = getBracket(window.getSelection());
    const afterTail = (tail?.nextElementSibling as HTMLElement) ?? null;
    swapTo("beforebegin", head, afterTail);
  }

  addLink(href: string, text: string) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const link = document.createElement("a");
    link.href = href;
    link.innerText = text;
    range.insertNode(link);
  }

  formatAll() {
    // run all the rules
  }
}

export function getLines(bracket: HTMLElement[]): HTMLElement[] {
  const [headElement, tailElement] = bracket;
  if (!headElement || !tailElement) return [];

  let currentElement: HTMLElement = headElement;
  const activeLines: HTMLElement[] = [currentElement];

  while (currentElement !== tailElement) {
    currentElement = currentElement.nextElementSibling as HTMLElement;
    activeLines.push(currentElement);
  }

  return activeLines;
}

export function getBracket(selection: Selection | null): HTMLElement[] {
  if (!selection?.anchorNode || !selection.focusNode) return [];

  const backward = isSelectionBackward(
    selection.anchorNode,
    selection.anchorOffset,
    selection.focusNode,
    selection.focusOffset
  );

  const anchorElement = (selection.anchorNode?.parentElement as HTMLElement)?.closest("[data-depth]") as HTMLElement;
  const focusElement = (selection.focusNode?.parentElement as HTMLElement)?.closest("[data-depth]") as HTMLElement;
  if (!anchorElement || !focusElement) return [];

  return backward ? [focusElement, anchorElement] : [anchorElement, focusElement];
}

export function indentLineRelative(levels: number, line: HTMLElement | null) {
  if (!line) return;
  line.dataset.depth = Math.max(0, parseInt(line.dataset.depth!) + levels).toString();
}

export function swapTo(pos: InsertPosition, self: HTMLElement | null, other: HTMLElement | null) {
  if (!self || !other) return;
  self.insertAdjacentElement(pos, other);
}

export function isSelectionBackward(
  anchorNode: Node,
  anchorOffset: number,
  focusNode: Node,
  focusOffset: number
): boolean {
  const position = anchorNode.compareDocumentPosition(focusNode);
  const isBackward = (!position && anchorOffset > focusOffset) || position === Node.DOCUMENT_POSITION_PRECEDING;

  return isBackward;
}
