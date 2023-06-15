import { client, dedicatedWorkerHostPort, server } from "@tinykb/rpc-utils";
import { getDefaultKeymap, openCommandPalette, save } from "../modules/editor/editor";
import { EditorElement } from "../modules/editor/editor-element";
import { OmniboxElement } from "../modules/omnibox/omnibox-element";
import { DialogElement } from "../modules/shell/dialog-element";
import { ShellElement } from "../modules/shell/shell-element";
import { StatusBarElement } from "../modules/status/status-bar-element";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./notebook.css";

import { markdown } from "@codemirror/lang-markdown";
import { keymap } from "@codemirror/view";
import { getCombo } from "@tinykb/dom-utils";
import { gruvboxDark } from "cm6-theme-gruvbox-dark";
import { EditorView, basicSetup } from "codemirror";
import { defineYamlNodes } from "../modules/editor/code-mirror-ext/custom-tags";
import { frontmatterParser } from "../modules/editor/code-mirror-ext/frontmatter-parser";

const worker = new Worker("./data-worker.js", { type: "module" });

const routes = {
  setStatus: (text: string) => statusBar.setText(text),
};
server({ routes, port: dedicatedWorkerHostPort(worker) });
const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });
export type NotebookRoutes = typeof routes;

customElements.define("shell-element", ShellElement);
customElements.define("dialog-element", DialogElement);
// customElements.define("editor-element", EditorV2);
customElements.define("status-bar-element", StatusBarElement);
customElements.define("omnibox-element", OmniboxElement);

const dialog = document.querySelector<DialogElement>("dialog-element")!;
const editor = document.querySelector<EditorElement>("editor-element")!;
const statusBar = document.querySelector<StatusBarElement>("status-bar-element")!;

const appKeymap = getDefaultKeymap(editor, dialog, proxy);
window.addEventListener("keydown", (e) => {
  if (e.isComposing) return;
  const keyCombo = getCombo(e);
  const matchedHandler = appKeymap?.[keyCombo];
  if (matchedHandler) {
    e.preventDefault();
    matchedHandler();
  }
});

statusBar.setText("Loading...");

async function initEditor(dialog: DialogElement) {
  function omnibox() {
    return keymap.of([
      {
        key: "Ctrl-Space",
        run() {
          openCommandPalette(dialog, proxy);
          return true;
        },
      },
      {
        key: "Ctrl-s",
        preventDefault: true,
        run() {
          debugger;
          save(() => view.state.doc.toString(), proxy);
          return true;
        },
      },
      {
        key: "Ctrl-S",
        preventDefault: true,
        run() {
          debugger;
          save(() => view.state.doc.toString(), proxy)
            .then(() => proxy.pull())
            .then(() => proxy.push());
          return true;
        },
      },
    ]);
  }

  const view = new EditorView({
    doc: "",
    extensions: [
      basicSetup,
      markdown({ extensions: { parseBlock: [frontmatterParser], defineNodes: defineYamlNodes() } }),
      gruvboxDark,
      omnibox(),
    ],
    parent: document.getElementById("editor-root")!,
  });

  const path = new URLSearchParams(location.search).get("path");
  if (!path) {
    view.dispatch({
      changes: {
        from: 0,
        insert: `---
title: New note
created: ${new Date().toISOString()}
---

- New item`,
      },
    });
    return;
  }
  const file = await proxy.getFile(path);
  if (!file) return;

  view.dispatch({
    changes: {
      from: 0,
      insert: file.content ?? "",
    },
  });
}

initEditor(dialog);
