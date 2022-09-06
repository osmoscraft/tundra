import type { HaikuEditorElement } from "@tinykb/haiku-editor";
import { useEffect, useRef } from "preact/hooks";

export interface FrameProps {
  initialMarkdown?: string;
  onSave: (markdown: string) => any;
}
export function Frame(props: FrameProps) {
  const editorRef = useRef<HaikuEditorElement>(null);

  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    if (!props.initialMarkdown) return;

    editorRef.current?.setMarkdown(props.initialMarkdown);
    isLoaded.current = true;
  }, [props.initialMarkdown]);

  return (
    <>
      <menu>
        <li>
          <button onClick={() => {}}>Save</button>
        </li>
      </menu>
      <haiku-editor-element class="haiku-editor" ref={editorRef} />
      <hr />
      <pre>
        <code id="view-source"></code>
      </pre>
    </>
  );
}
