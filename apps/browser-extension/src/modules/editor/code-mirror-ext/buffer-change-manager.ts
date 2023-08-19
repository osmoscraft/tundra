import type { ViewUpdate } from "@codemirror/view";
import { EditorView } from "codemirror";

export interface BufferChangeManagerConfig {
  onChange: (baseState: null | string, headState: null | string) => void;
}
export function bufferChangeManager(config: BufferChangeManagerConfig) {
  let baseState: null | string = null;
  let headState: null | string = null;

  function handleBeforeunload(e: Event | BeforeUnloadEvent) {
    if (baseState === null || headState === null) return;
    if (baseState === headState) return;

    e.preventDefault();
    if (e instanceof BeforeUnloadEvent) {
      e.returnValue = "";
    }
  }

  function setBufferChangeBase(value: string) {
    baseState = value;
    headState = null;
    reportChange();
  }

  function reportChange() {
    config.onChange(baseState, headState);

    if (baseState === null || headState === null) return;
    console.log("Is dirty: ", baseState !== headState);
  }

  const extension = EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
    if (viewUpdate.docChanged) {
      const now = performance.now();

      requestIdleCallback(() => {
        const latency = performance.now() - now;
        console.log(`[perf] change detection latency`, latency);
        headState = viewUpdate.state.doc.toString();
        reportChange();
      });
    }
  });

  return {
    handleBeforeunload,
    setBufferChangeBase,
    extension,
  };
}
