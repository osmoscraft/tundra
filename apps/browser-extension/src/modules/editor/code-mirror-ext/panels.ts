import { type Extension } from "@codemirror/state";
import { showPanel } from "@codemirror/view";

export function topPanel(dom: HTMLElement): Extension {
  return showPanel.of(() => ({ dom, top: true }));
}

export function bottomPanel(dom: HTMLElement): Extension {
  return showPanel.of(() => ({ dom }));
}
