import { client, dedicatedWorkerHostPort, server } from "@tinykb/rpc-utils";
import { getDefaultKeymap, loadNoteFromUrl } from "../modules/editor/editor";
import { EditorElement } from "../modules/editor/editor-element";
import { OmniboxElement } from "../modules/omnibox/omnibox-element";
import { DialogElement } from "../modules/shell/dialog-element";
import { ShellElement } from "../modules/shell/shell-element";
import { StatusBarElement } from "../modules/status/status-bar-element";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./notebook.css";

const worker = new Worker("./data-worker.js", { type: "module" });

const routes = {
  setStatus: (text: string) => statusBar.setText(text),
};
server({ routes, port: dedicatedWorkerHostPort(worker) });
const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });
export type NotebookRoutes = typeof routes;

customElements.define("shell-element", ShellElement);
customElements.define("dialog-element", DialogElement);
customElements.define("editor-element", EditorElement);
customElements.define("status-bar-element", StatusBarElement);
customElements.define("omnibox-element", OmniboxElement);

const dialog = document.querySelector<DialogElement>("dialog-element")!;
const editor = document.querySelector<EditorElement>("editor-element")!;
const statusBar = document.querySelector<StatusBarElement>("status-bar-element")!;

const keymap = getDefaultKeymap(editor, dialog, proxy);
editor.setKeymap(keymap);

statusBar.setText("Loading...");

loadNoteFromUrl(proxy, editor).then(() => editor.focus());
proxy.fetchGithub();
