import { type Extension } from "@codemirror/state";
import { EditorView, showPanel, type Panel } from "@codemirror/view";

function getTopPanel(dom: HTMLElement, _view: EditorView): Panel {
  return {
    dom,
    top: true,
  };
}

export interface TopPanelProps {
  menu: HTMLElement;
  prompt: HTMLElement;
  statusBar: HTMLElement;
}
export function topPanel(dom: HTMLElement): Extension {
  return showPanel.of(getTopPanel.bind(null, dom));
}

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
