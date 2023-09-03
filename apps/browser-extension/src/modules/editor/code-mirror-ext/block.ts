import type { EditorView } from "@codemirror/view";

const blockEdgePattern = /([^\n]+)(\n)+\n/m;
function moveCursorBlock(view: EditorView, reverse?: boolean, select?: boolean) {
  const { head: currentHead, anchor: currentAnchor } = view.state.selection.main;
  const textRaw = (
    reverse
      ? view.state.doc.slice(0, currentHead).toString().split("").reverse().join("")
      : view.state.doc.slice(currentHead)
  ).toString();
  const match = textRaw.match(blockEdgePattern);
  const offset = match ? match.index! + match[1].length : textRaw.length;
  const cursorHead = currentHead + (reverse ? -offset : offset);
  return {
    anchor: select ? currentAnchor : cursorHead,
    head: cursorHead,
  };
}

export const moveCursorBlockStart = (view: EditorView) => {
  view.dispatch({
    selection: moveCursorBlock(view, true),
    scrollIntoView: true,
  });

  return true;
};

export const moveCursorBlockEnd = (view: EditorView) => {
  view.dispatch({
    selection: moveCursorBlock(view, false),
    scrollIntoView: true,
  });

  return true;
};

export const selectCursorBlockStart = (view: EditorView) => {
  view.dispatch({
    selection: moveCursorBlock(view, true, true),
    scrollIntoView: true,
  });

  return true;
};

export const selectCursorBlockEnd = (view: EditorView) => {
  view.dispatch({
    selection: moveCursorBlock(view, false, true),
    scrollIntoView: true,
  });

  return true;
};
