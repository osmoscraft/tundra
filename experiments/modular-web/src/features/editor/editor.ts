export function setEditorHtml(editorRoot: HTMLElement, html: string) {
  editorRoot.innerHTML = /*html*/ `<div contenteditable="true">${html}</div>`;
}

export function getEditorHtml(editorRoot: HTMLElement) {
  return editorRoot.children[0].innerHTML;
}

export const indentRelative = (levels: number) => getLines(getBracket(window.getSelection())).map(indentLineRelative.bind(null, levels));

export function moveUp() {
  const [head, tail] = getBracket(window.getSelection());
  const beforeHead = (head?.previousElementSibling as HTMLElement) ?? null;
  swapTo("afterend", tail, beforeHead);
}

export function moveDown() {
  const [head, tail] = getBracket(window.getSelection());
  const afterTail = (tail?.nextElementSibling as HTMLElement) ?? null;
  swapTo("beforebegin", head, afterTail);
}

export function addLink(href: string, text: string) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const link = document.createElement("a");
  link.href = href;
  link.innerText = text;
  range.insertNode(link);
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

  const backward = isSelectionBackward(selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset);

  const anchorElement = closestHTMLElement(selection.anchorNode)?.closest("[data-depth]") as HTMLElement;
  const focusElement = closestHTMLElement(selection.focusNode)?.closest("[data-depth]") as HTMLElement;
  if (!anchorElement || !focusElement) return [];

  return backward ? [focusElement, anchorElement] : [anchorElement, focusElement];
}

function closestHTMLElement(node: Node) {
  return node instanceof HTMLElement ? node : node.parentElement;
}

export function indentLineRelative(levels: number, line: HTMLElement | null) {
  if (!line) return;
  line.dataset.depth = Math.max(0, parseInt(line.dataset.depth!) + levels).toString();
}

export function swapTo(pos: InsertPosition, self: HTMLElement | null, other: HTMLElement | null) {
  if (!self || !other) return;
  self.insertAdjacentElement(pos, other);
}

export function isSelectionBackward(anchorNode: Node, anchorOffset: number, focusNode: Node, focusOffset: number): boolean {
  const position = anchorNode.compareDocumentPosition(focusNode);
  const isBackward = (!position && anchorOffset > focusOffset) || position === Node.DOCUMENT_POSITION_PRECEDING;

  return isBackward;
}
