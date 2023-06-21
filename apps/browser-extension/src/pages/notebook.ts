import { history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, drawSelection, dropCursor, highlightActiveLine, keymap } from "@codemirror/view";
import { client, dedicatedWorkerHostPort, server, type AsyncProxy } from "@tinykb/rpc-utils";
import { blockMovementKeymap } from "../modules/editor/code-mirror-ext/block-movement-keymap";
import { defineYamlNodes } from "../modules/editor/code-mirror-ext/custom-tags";
import { frontmatterParser } from "../modules/editor/code-mirror-ext/frontmatter-parser";
import { liveLink } from "../modules/editor/code-mirror-ext/live-link";
import { omniboxKeymap } from "../modules/editor/code-mirror-ext/omnibox-keymap";
import { systemBar } from "../modules/editor/code-mirror-ext/system-bar";
import { loadInitialDoc } from "../modules/editor/load-initial-doc";
import { OmniboxElement } from "../modules/editor/omnibox/omnibox-element";
import { StatusBarElement } from "../modules/editor/status/status-bar-element";
import { OmnimenuElement } from "../modules/editor/suggestion-list/omnimenu-element";
import { SystemBarElement } from "../modules/system-bar/system-bar-element";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./notebook.css";

const worker = new Worker("./data-worker.js", { type: "module" });

const routes = {
  setStatus: (text: string) => statusBar.setText(text),
};
server({ routes, port: dedicatedWorkerHostPort(worker) });
const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });
export type NotebookRoutes = typeof routes;

customElements.define("status-bar-element", StatusBarElement);
customElements.define("omnibox-element", OmniboxElement);
customElements.define("omnimenu-element", OmnimenuElement);
customElements.define("system-bar-element", SystemBarElement);

const systemBarElement = document.createElement("system-bar-element") as SystemBarElement;
systemBarElement.innerHTML = `
<omnibox-element slot="prompt"></omnibox-element>
<omnimenu-element slot="menu"></omnimenu-element>
<status-bar-element slot="status"></status-bar-element>
`;

const statusBar = systemBarElement.querySelector<StatusBarElement>("status-bar-element")!;
const omnibox = systemBarElement.querySelector<OmniboxElement>("omnibox-element")!;
const menu = systemBarElement.querySelector<OmnimenuElement>("omnimenu-element")!;

statusBar.setText("Loading...");

async function initEditor(proxy: AsyncProxy<DataWorkerRoutes>) {
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
      keymap.of([...blockMovementKeymap, ...historyKeymap, ...omniboxKeymap(omnibox, proxy)]),
    ],
    parent: document.getElementById("editor-root")!,
  });

  view.focus();

  omnibox.addEventListener("omnibox-load-default", async () => {
    const files = await proxy.getRecentFiles();
    menu.setSuggestions(files.map((file) => ({ path: file.path, title: file.path })));
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

  await loadInitialDoc(view, proxy);
}

initEditor(proxy);
