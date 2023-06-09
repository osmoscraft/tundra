import { getCombo } from "@tinykb/dom-utils";
import type { Fn } from "@tinykb/fp-utils";
import { htmlToMarkdown, markdownToHtml } from "./codec";
import "./editor-element.css";

export type Keymap = Record<string, Fn | undefined>;

export class EditorElement extends HTMLElement {
  private editableRoot = document.createElement("div");
  private keymap?: Keymap;

  constructor() {
    super();
    this.editableRoot.contentEditable = "true";
    this.appendChild(this.editableRoot);
    this.handleEvents(this.editableRoot);
  }

  handleEvents(editableRoot: HTMLElement) {
    editableRoot.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      console.log("==============");
      console.log("[1] keydown", e);
      if (e.isComposing) return;
      const keyCombo = getCombo(e);
      const matchedHandler = this.keymap?.[keyCombo];
      if (matchedHandler) {
        e.preventDefault();
        matchedHandler();
      }
      // handle commands: move, link, undo/redo
    });
    editableRoot.addEventListener("compositionstart", (e) => {
      console.log("[2] compositionstart", e);
      // noop
    });
    editableRoot.addEventListener("copy", (e) => {
      console.log("[3.a] copy", e);
      // handle pre-copy formatting
    });
    editableRoot.addEventListener("paste", (e) => {
      console.log("[3.b] paste", e);
      // mark dirty lines
      // format pasted content
    });
    editableRoot.addEventListener("cut", (e) => {
      console.log("[3.c] cut", e);
      // mark dirty lines
      // format pasted content
    });
    editableRoot.addEventListener("beforeinput", (e) => {
      if (e.isComposing) return;
      console.log("[4] beforeinput", e);
      // mark dirty lines
    });
    editableRoot.addEventListener("input", (e) => {
      if ((e as InputEvent).isComposing) return;
      console.log("[5] input", e);
      // noop
    });
    editableRoot.addEventListener("compositionend", (e) => {
      console.log("[6] compositionend", e);
      // noop
    });
    editableRoot.addEventListener("keyup", (e) => {
      if (e.isComposing) return;
      console.log("[7] keyup", e);
      // note: lots of noise events from IME and dialog manager
    });
  }

  focus() {
    this.editableRoot.focus();
  }

  setKeymap(keymap: Keymap) {
    this.keymap = keymap;
  }

  setMarkdown(markdown: string) {
    this.editableRoot.innerHTML = markdownToHtml(markdown);
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
