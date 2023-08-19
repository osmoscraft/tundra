import type { ViewUpdate } from "@codemirror/view";
import { EditorView } from "codemirror";

export function changeManager() {
  let baseState: null | string = null;
  let headState: null | string = null;

  function setChangeBase(value: string) {
    baseState = value;
    headState = null;
    reportChange();
  }

  function reportChange() {
    if (baseState === null || headState === null) return;
    console.log("Is dirty: ", baseState !== headState);
  }

  const extension = EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
    if (viewUpdate.docChanged) {
      const now = performance.now();
      requestIdleCallback(() => {
        const latency = performance.now() - now;
        console.log(latency, viewUpdate.state);
        headState = viewUpdate.state.doc.toString();
        reportChange();
      });
    }
  });

  return {
    setChangeBase,
    extension,
  };
}
