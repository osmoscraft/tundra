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
import { OmniboxElement } from "../modules/omnibox/omnibox-element";
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

customElements.define("status-bar-element", StatusBarElement);
customElements.define("omnibox-element", OmniboxElement);

const statusBar = document.createElement("status-bar-element") as StatusBarElement;
statusBar.setText("Loading...");
const omnibox = document.createElement("omnibox-element") as OmniboxElement;

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
      systemBar({
        prompt: omnibox,
        status: statusBar,
      }),
      oneDark,
      keymap.of([...blockMovementKeymap, ...historyKeymap, ...omniboxKeymap(omnibox, proxy)]),
    ],
    parent: document.getElementById("editor-root")!,
  });

  view.focus();

  omnibox.addEventListener("omnibox-load-default", async () => {
    const files = await proxy.getRecentFiles();
    omnibox.setSuggestions(files.map((file) => ({ path: file.path, title: file.path })));
  });

  omnibox.addEventListener("omnibox-input", async (e) => {
    performance.mark("search-start");
    const searchResults = await proxy.search({ query: e.detail, limit: 10 });
    omnibox.setSuggestions(searchResults.map((result) => ({ path: result.node.path, title: result.node.title })));
    console.log(`[perf] search latency ${performance.measure("search", "search-start").duration.toFixed(2)}ms`);
  });

  omnibox.addEventListener("omnibox-exit", () => {
    view.focus();
  });

  await loadInitialDoc(view, proxy);
}

initEditor(proxy);
