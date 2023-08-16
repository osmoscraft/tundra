import { type Extension } from "@codemirror/state";
import { EditorView, showPanel, type Panel } from "@codemirror/view";

function getBottomPanel(dom: HTMLElement, _view: EditorView): Panel {
  return {
    dom,
  };
}

export interface TopPanelProps {
  referenceCard: HTMLElement;
}
export function bottomPanel(dom: HTMLElement): Extension {
  return showPanel.of(getBottomPanel.bind(null, dom));
}
