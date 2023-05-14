import { getCombo } from "@tinykb/dom-utils";
import { client, dedicatedWorkerHostPort, type AsyncProxy } from "@tinykb/rpc-utils";
import { EditorElement } from "../modules/editor/editor-element";
import { FileTreeElement } from "../modules/editor/file-tree-element";
import { DialogElement } from "../modules/shell/dialog-element";
import { ShellElement } from "../modules/shell/shell-element";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./notebook.css";

const worker = new Worker("./data-worker.js", { type: "module" });

const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });

customElements.define("shell-element", ShellElement);
customElements.define("dialog-element", DialogElement);
customElements.define("file-tree-element", FileTreeElement);
customElements.define("editor-element", EditorElement);

const dialog = document.querySelector<DialogElement>("dialog-element")!;
const editor = document.querySelector<EditorElement>("editor-element")!;
editor.addEventListener("keydown", async (e) => {
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
    case "ctrl+p":
      e.preventDefault();
      const fileTree = document.createElement("file-tree-element") as FileTreeElement;
      const files = await proxy.listFiles();
      fileTree.setFiles(files.map((file) => ({ path: file.path, displayName: file.path })) ?? []);
      dialog.setContentElement(fileTree);
      break;
  }
});

async function loadNoteFromUrl(proxy: AsyncProxy<DataWorkerRoutes>, haikuEditor: EditorElement) {
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

loadNoteFromUrl(proxy, editor);
