import { type Extension } from "@codemirror/state";
import { EditorView, showPanel, type Panel } from "@codemirror/view";

function systemBarPanel(dom: HTMLElement, view: EditorView): Panel {
  return {
    dom,
  };
}

export interface SystemBarProps {
  menu: HTMLElement;
  prompt: HTMLElement;
  statusBar: HTMLElement;
}
export function systemBar(dom: HTMLElement): Extension {
  return showPanel.of(systemBarPanel.bind(null, dom));
}
