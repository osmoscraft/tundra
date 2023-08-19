import type { ViewUpdate } from "@codemirror/view";
import { EditorView } from "codemirror";

export interface BufferState {
  base: string | null;
  head: string | null;
}

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

  function trackBufferChange(updateFn: (prev: BufferState) => BufferState) {
    const { base, head } = updateFn({ base: baseState, head: headState });
    baseState = base;
    headState = head;
    reportChange();
  }

  function reportChange() {
    config.onChange(baseState, headState);
  }

  const extension = EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
    if (viewUpdate.docChanged) {
      const now = performance.now();

      requestIdleCallback(
        () => {
          const latency = performance.now() - now;
          if (latency > 100) {
            console.warn(`[perf] long change detection latency ${latency}ms`);
          }
          headState = viewUpdate.state.doc.toString();
          reportChange();
        },
        { timeout: 1000 }
      );
    }
  });

  return {
    handleBeforeunload,
    trackBufferChange,
    extension,
  };
}
