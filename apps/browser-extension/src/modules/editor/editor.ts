import type { Fn } from "@tinykb/fp-utils";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { DialogElement } from "../shell/dialog-element";
import type { EditorElement } from "./editor-element";
import type { FileTreeElement } from "./file-tree-element";

export async function loadNoteFromUrl(proxy: AsyncProxy<DataWorkerRoutes>, haikuEditor: EditorElement) {
  const path = new URLSearchParams(location.search).get("path");
  if (!path) {
    haikuEditor.setMarkdown("- New item");
    return;
  }
  const file = await proxy.getFile(path);
  if (!file) return;
  haikuEditor.setMarkdown(file.content);
}

export type Keymap = Record<string, Fn | undefined>;
export function getDefaultKeymap(
  editor: EditorElement,
  dialog: DialogElement,
  proxy: AsyncProxy<DataWorkerRoutes>
): Keymap {
  return {
    "alt+h": () => editor.indentRelative(-1),
    "alt+l": () => editor.indentRelative(1),
    "alt+k": () => editor.moveUp(),
    "alt+j": () => editor.moveDown(),
    "ctrl+space": () => openCommandPalette(dialog, proxy),
    "ctrl+s": () => save(editor, proxy),
    "ctrl+shift+s": () => proxy.syncGitHub(),
  };
}

async function openCommandPalette(dialog: DialogElement, proxy: AsyncProxy<DataWorkerRoutes>) {
  const fileTree = document.createElement("file-tree-element") as FileTreeElement;
  const files = await proxy.listFiles();
  fileTree.setFiles(files.map((file) => ({ path: file.path, displayName: file.path })) ?? []);
  dialog.setContentElement(fileTree);
}

async function save(editor: EditorElement, proxy: AsyncProxy<DataWorkerRoutes>) {
  const path = new URLSearchParams(location.search).get("path");
  if (!path) {
    // save new draft
    const timestamp = new Date()
      .toISOString()
      .split(".")[0]
      .replaceAll(/(-|:|T)/g, "");

    const path = `/notes/${timestamp}.md`;

    await proxy.writeFile(path, editor.getMarkdown());
    const mutableUrl = new URL(location.href);
    mutableUrl.searchParams.set("path", path);
    history.replaceState(null, "", mutableUrl.toString());
  } else {
    // update existing file
    await proxy.writeFile(path, editor.getMarkdown());
  }
}
