import { getCombo } from "@tinykb/dom-utils";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { DialogElement } from "../shell/dialog-element";
import type { EditorElement } from "./editor-element";
import type { FileTreeElement } from "./file-tree-element";

export async function loadNoteFromUrl(proxy: AsyncProxy<DataWorkerRoutes>, haikuEditor: EditorElement) {
  const isDraft = new URLSearchParams(location.search).has("draft");
  if (isDraft) {
    haikuEditor.setMarkdown("- New item");
    return;
  }

  const path = new URLSearchParams(location.search).get("path");
  if (!path) return;
  const file = await proxy.getFile(path);
  if (!file) return;
  haikuEditor.setMarkdown(file.content);
}

export function handleListEdit(editor: EditorElement, e: KeyboardEvent) {
  if (e.isComposing) return;
  const keyCombo = getCombo(e);
  switch (keyCombo) {
    case "alt+h":
      e.preventDefault();
      editor.indentRelative(-1);
      break;
    case "alt+l":
      e.preventDefault();
      editor.indentRelative(1);
      break;
    case "alt+k":
      e.preventDefault();
      editor.moveUp();
      break;
    case "alt+j":
      e.preventDefault();
      editor.moveDown();
      break;
  }
}

export async function handleCommandPalette(
  dialog: DialogElement,
  proxy: AsyncProxy<DataWorkerRoutes>,
  e: KeyboardEvent
) {
  if (e.isComposing) return;
  const keyCombo = getCombo(e);
  switch (keyCombo) {
    case "ctrl+p":
      e.preventDefault();
      const fileTree = document.createElement("file-tree-element") as FileTreeElement;
      const files = await proxy.listFiles();
      fileTree.setFiles(files.map((file) => ({ path: file.path, displayName: file.path })) ?? []);
      dialog.setContentElement(fileTree);
      break;
  }
}
