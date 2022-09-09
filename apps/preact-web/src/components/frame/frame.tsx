import type { HaikuEditorElement } from "@tinykb/haiku-editor";
import { useEffect, useRef } from "preact/hooks";
import { getEvenHub } from "../../utils/events";

export interface FrameProps {
  class?: string;
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

  useEffect(() => {
    const onExecSave = (e: Event) => {
      if (!editorRef.current) return;

      if ((e as CustomEvent).detail === "save") {
        props.onSave(editorRef.current.getMarkdown());
      }
    };

    getEvenHub("command").addEventListener("exec", onExecSave);

    return () => getEvenHub("command").removeEventListener("exec", onExecSave);
  }, [props.onSave]);

  return (
    <div class={props.class}>
      <haiku-editor-element class="haiku-editor" ref={editorRef} />
      <hr />
      <pre>
        <code id="view-source"></code>
      </pre>
    </div>
  );
}
