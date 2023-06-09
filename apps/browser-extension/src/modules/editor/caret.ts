export interface Caret {
  anchor: CaretPosition;
  focus: CaretPosition;
  start: CaretPosition;
  end: CaretPosition;
  isCollapsed: boolean;
}

export interface CaretPosition {
  node: Node;
  offset: number;
}

export function getCaretFromSelection(selection: Selection): Caret | null {
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  if (!anchorNode || !focusNode) return null;

  if (!selection.rangeCount) return null;
  const range = selection.getRangeAt(0);

  return {
    anchor: {
      node: anchorNode,
      offset: anchorOffset,
    },
    focus: {
      node: focusNode,
      offset: focusOffset,
    },
    start: {
      node: range.startContainer,
      offset: range.startOffset,
    },
    end: {
      node: range.endContainer,
      offset: range.endOffset,
    },
    isCollapsed: selection.isCollapsed,
  };
}

export function setCaret(anchor: Node, offset: number) {
  const selection = window.getSelection();
  if (!selection) return;

  selection.collapse(anchor, offset);
}
