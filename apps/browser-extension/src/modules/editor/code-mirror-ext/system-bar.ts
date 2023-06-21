import { type Extension } from "@codemirror/state";
import { EditorView, showPanel, type Panel } from "@codemirror/view";

function systemBarPanel(props: SystemBarProps, view: EditorView): Panel {
  const container = document.createElement("div");
  container.appendChild(props.prompt);
  container.appendChild(props.status);

  return {
    dom: container,
  };
}

export interface SystemBarProps {
  prompt: HTMLElement;
  status: HTMLElement;
}
export function systemBar(props: SystemBarProps): Extension {
  return showPanel.of(systemBarPanel.bind(null, props));
}
