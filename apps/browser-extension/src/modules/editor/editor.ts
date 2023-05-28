import type { Fn } from "@tinykb/fp-utils";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { OmniboxElement } from "../omnibox/omnibox-element";
import type { DialogElement } from "../shell/dialog-element";
import { timestampToLocalPath } from "../sync/path";
import type { EditorElement } from "./editor-element";

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
    "ctrl+shift+s": () =>
      save(editor, proxy)
        .then(() => proxy.pullGitHub())
        .then(() => proxy.pushGitHub()),
    "ctrl+y": () => proxy.fetchGithub(),
    "ctrl+shift+y": () => proxy.pullGitHub(),
  };
}

async function openCommandPalette(dialog: DialogElement, proxy: AsyncProxy<DataWorkerRoutes>) {
  const omnibox = document.createElement("omnibox-element") as OmniboxElement;

  omnibox.addEventListener("omnibox-load-default", async () => {
    const files = await proxy.listFiles();
    omnibox.setSuggestions(files.map((file) => ({ path: file.path, title: file.path })));
  });

  omnibox.addEventListener("omnibox-input", async (e) => {
    const searchResults = await proxy.searchNodes(e.detail);
    omnibox.setSuggestions(searchResults.map((node) => ({ path: node.path, title: node.title })));
  });

  dialog.setContentElement(omnibox);
}

async function save(editor: EditorElement, proxy: AsyncProxy<DataWorkerRoutes>) {
  const path = new URLSearchParams(location.search).get("path");
  if (!path) {
    // save new draft
    const path = timestampToLocalPath(new Date());

    await proxy.writeFile(path, editor.getMarkdown());
    const mutableUrl = new URL(location.href);
    mutableUrl.searchParams.set("path", path);
    history.replaceState(null, "", mutableUrl.toString());
  } else {
    // update existing file
    await proxy.writeFile(path, editor.getMarkdown());
  }
}
