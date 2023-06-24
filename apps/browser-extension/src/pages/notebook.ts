import { history } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, drawSelection, dropCursor, highlightActiveLine, keymap } from "@codemirror/view";
import { client, dedicatedWorkerHostPort, server, type AsyncProxy } from "@tinykb/rpc-utils";
import { defineYamlNodes } from "../modules/editor/code-mirror-ext/custom-tags";
import { frontmatterParser } from "../modules/editor/code-mirror-ext/frontmatter-parser";
import { liveLink } from "../modules/editor/code-mirror-ext/live-link";
import { systemBar } from "../modules/editor/code-mirror-ext/system-bar";
import {
  extendedCommands,
  getKeyBindings,
  editorCommands as nativeCommands,
  type CommandKeyBinding,
} from "../modules/editor/commands";
import { loadInitialDoc } from "../modules/editor/load-initial-doc";
import { OmniboxElement } from "../modules/editor/omnibox/omnibox-element";
import { StatusBarElement } from "../modules/editor/status/status-bar-element";
import { OmnimenuElement } from "../modules/editor/suggestion-list/omnimenu-element";
import userConfig from "../modules/editor/user-config.json";
import { SystemBarElement } from "../modules/system-bar/system-bar-element";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./notebook.css";

customElements.define("status-bar-element", StatusBarElement);
customElements.define("omnibox-element", OmniboxElement);
customElements.define("omnimenu-element", OmnimenuElement);
customElements.define("system-bar-element", SystemBarElement);

const worker = new Worker("./data-worker.js", { type: "module" });

const statusEvents = new EventTarget();

export type NotebookRoutes = typeof routes;
const routes = {
  setStatus: (text: string) => statusEvents.dispatchEvent(new CustomEvent("status", { detail: text })),
};

server({ routes, port: dedicatedWorkerHostPort(worker) });
const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });

function main() {
  const systemBarElement = document.querySelector<SystemBarElement>("system-bar-element")!;
  const statusBar = document.querySelector<StatusBarElement>("status-bar-element")!;
  const omnibox = document.querySelector<OmniboxElement>("omnibox-element")!;
  const menu = document.querySelector<OmnimenuElement>("omnimenu-element")!;

  const editoView = initEditor(proxy, systemBarElement, omnibox);
  initSystemBar(proxy, editoView, omnibox, menu, statusBar);
  initContent(proxy, editoView);
}

main();

function initSystemBar(
  proxy: AsyncProxy<DataWorkerRoutes>,
  view: EditorView,
  omnibox: OmniboxElement,
  menu: OmnimenuElement,
  statusBar: StatusBarElement
) {
  statusEvents.addEventListener("status", (e) => statusBar.setText((e as CustomEvent<string>).detail));

  omnibox.addEventListener("omnibox-load-default", async () => {
    const searchResults = await proxy.getRecentFiles();
    menu.setSuggestions(searchResults.map((result) => ({ path: result.node.path, title: result.node.title })));
  });

  omnibox.addEventListener("omnibox-input", async (e) => {
    performance.mark("search-start");
    const searchResults = await proxy.search({ query: e.detail, limit: 10 });
    menu.setSuggestions(searchResults.map((result) => ({ path: result.node.path, title: result.node.title })));
    console.log(`[perf] search latency ${performance.measure("search", "search-start").duration.toFixed(2)}ms`);
  });

  omnibox.addEventListener("omnibox-exit", () => {
    menu.clear();
    view.focus();
  });
}

function initEditor(proxy: AsyncProxy<DataWorkerRoutes>, systemBarElement: SystemBarElement, omnibox: OmniboxElement) {
  const configKeyBindings = userConfig.keyBindings as CommandKeyBinding[];
  const library = { ...nativeCommands(), ...extendedCommands(proxy, omnibox) };
  const bindings = getKeyBindings(configKeyBindings, library);

  const view = new EditorView({
    doc: "",
    extensions: [
      liveLink(),
      history(),
      highlightActiveLine(),
      drawSelection(),
      dropCursor(),
      EditorView.lineWrapping,
      markdown({ extensions: { parseBlock: [frontmatterParser], defineNodes: defineYamlNodes() } }),
      systemBar(systemBarElement),
      oneDark,
      keymap.of(bindings.keyBindings),
    ],
    parent: document.getElementById("editor-root")!,
  });

  view.focus();
  return view;
}

function initContent(proxy: AsyncProxy<DataWorkerRoutes>, view: EditorView) {
  return loadInitialDoc(view, proxy);
}
