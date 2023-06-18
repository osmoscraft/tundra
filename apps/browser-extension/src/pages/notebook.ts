import { client, dedicatedWorkerHostPort, server } from "@tinykb/rpc-utils";
import { openCommandPalette, save } from "../modules/editor/editor";
import { OmniboxElement } from "../modules/omnibox/omnibox-element";
import { DialogElement } from "../modules/shell/dialog-element";
import { ShellElement } from "../modules/shell/shell-element";
import { StatusBarElement } from "../modules/status/status-bar-element";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./notebook.css";

import { markdown } from "@codemirror/lang-markdown";
import { keymap } from "@codemirror/view";
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
customElements.define("status-bar-element", StatusBarElement);
customElements.define("omnibox-element", OmniboxElement);

const dialog = document.querySelector<DialogElement>("dialog-element")!;
const statusBar = document.querySelector<StatusBarElement>("status-bar-element")!;

statusBar.setText("Loading...");

async function initEditor(dialog: DialogElement) {
  function omnibox() {
    // TODO basicSetup uses ctrl space for autocompletion
    return keymap.of([
      {
        key: "Mod-k",
        preventDefault: true,
        run() {
          openCommandPalette(dialog, proxy);
          return true;
        },
      },
      {
        key: "Mod-s",
        preventDefault: true,
        run() {
          save(() => view.state.doc.toString(), proxy);
          return true;
        },
      },
      {
        key: "Mod-S",
        preventDefault: true,
        run() {
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
title: "New note"
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

  view.focus();
}

initEditor(dialog);
