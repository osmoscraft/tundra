import type { EditorView } from "@codemirror/view";

export function getSelectedText(view: EditorView): string {
  const selectedText = view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to);
  return selectedText;
}
