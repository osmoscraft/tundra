import type { HaikuEditorElement } from "@tinykb/haiku-editor";
import { useCallback, useEffect, useRef } from "preact/hooks";

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

  const handleSave = useCallback(() => {
    if (!editorRef.current) return;
    props.onSave(editorRef.current.getMarkdown());
  }, [props.onSave]);

  return (
    <>
      <menu>
        <li>
          <button onClick={handleSave}>Save</button>
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
