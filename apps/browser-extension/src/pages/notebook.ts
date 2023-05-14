import { client, dedicatedWorkerHostPort } from "@tinykb/rpc-utils";
import { getDefaultKeymap, loadNoteFromUrl } from "../modules/editor/editor";
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

const keymap = getDefaultKeymap(editor, dialog, proxy);
editor.setKeymap(keymap);

loadNoteFromUrl(proxy, editor).then(() => editor.focus());
