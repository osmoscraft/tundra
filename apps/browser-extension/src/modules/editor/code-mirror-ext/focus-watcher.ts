import type { ViewUpdate } from "@codemirror/view";
import { EditorView } from "codemirror";

export interface FocusWatcherConfig {
  onChange: (isFocused: boolean) => void;
}
export function focusWatcher(config: FocusWatcherConfig) {
  const extension = EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
    if (viewUpdate.focusChanged) {
      config.onChange(viewUpdate.view.hasFocus);
    }
  });

  return {
    extension,
  };
}
