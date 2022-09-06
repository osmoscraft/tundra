import { HaikuEditorElement } from "@tinykb/haiku-editor";
import "@tinykb/haiku-editor/haiku-editor.css";

declare global {
  namespace preact.createElement.JSX {
    interface IntrinsicElements {
      ["haiku-editor-element"]: HTMLAttributes<HaikuEditorElement>;
    }
  }
}

customElements.define("haiku-editor-element", HaikuEditorElement);
