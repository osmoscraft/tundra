import { client, dedicatedWorkerHostPort, server, type AsyncProxy } from "@tinykb/rpc-utils";
import { OmniboxElement } from "../modules/omnibox/omnibox-element";
import { DialogElement } from "../modules/shell/dialog-element";
import { ShellElement } from "../modules/shell/shell-element";
import { StatusBarElement } from "../modules/status/status-bar-element";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./notebook.css";

import { history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView, keymap } from "@codemirror/view";
import { gruvboxDark } from "cm6-theme-gruvbox-dark";
import { defineYamlNodes } from "../modules/editor/code-mirror-ext/custom-tags";
import { frontmatterParser } from "../modules/editor/code-mirror-ext/frontmatter-parser";
import { omniboxKeymap } from "../modules/editor/code-mirror-ext/omnibox-keymap";
import { loadInitialDoc } from "../modules/editor/load-initial-doc";

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

async function initEditor(dialog: DialogElement, proxy: AsyncProxy<DataWorkerRoutes>) {
  const view = new EditorView({
    doc: "",
    extensions: [
      history(),
      markdown({ extensions: { parseBlock: [frontmatterParser], defineNodes: defineYamlNodes() } }),
      gruvboxDark,
      keymap.of([...historyKeymap, ...omniboxKeymap(dialog, proxy)]),
    ],
    parent: document.getElementById("editor-root")!,
  });

  view.focus();

  await loadInitialDoc(view, proxy);
}

initEditor(dialog, proxy);
