import { history } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import type { Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  keymap,
  type Command,
  type KeyBinding,
} from "@codemirror/view";
import { client, dedicatedWorkerHostPort, type AsyncProxy } from "@tinykb/rpc-utils";
import { BacklinksElement } from "../modules/editor/backlinks/backlinks-element";
import { defineYamlNodes } from "../modules/editor/code-mirror-ext/custom-tags";
import { frontmatterParser } from "../modules/editor/code-mirror-ext/frontmatter-parser";
import { liveLink } from "../modules/editor/code-mirror-ext/live-link";
import { bottomPanel, topPanel } from "../modules/editor/code-mirror-ext/panels";
import {
  extendedCommands,
  getEditorBindings as getEditorKeyBindings,
  editorCommands as nativeCommands,
  type CommandKeyBinding,
  type CommandLibrary,
} from "../modules/editor/commands";
import { loadInitialDoc } from "../modules/editor/load-initial-doc";
import { OmniboxElement } from "../modules/editor/omnibox/omnibox-element";
import { StatusBarElement } from "../modules/editor/status/status-bar-element";
import { OmnimenuElement } from "../modules/editor/suggestion-list/omnimenu-element";
import userConfig from "../modules/editor/user-config.json";
import { BottomPanelElement } from "../modules/panels/bottom-panel-element";
import { TopPanelElement } from "../modules/panels/top-panel-element";
import { timestampToNotePath } from "../modules/sync/path";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./notebook.css";

customElements.define("status-bar-element", StatusBarElement);
customElements.define("omnibox-element", OmniboxElement);
customElements.define("omnimenu-element", OmnimenuElement);
customElements.define("top-panel-element", TopPanelElement);
customElements.define("backlinks-element", BacklinksElement);
customElements.define("bottom-panel-element", BottomPanelElement);

const worker = new Worker("./data-worker.js", { type: "module" });
const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });
const statusEvents = new EventTarget();

function main() {
  const panelTemplates = document.querySelector<HTMLTemplateElement>("#panel-templates")!;
  const topPanelElement = panelTemplates.content.querySelector<TopPanelElement>("top-panel-element")!;
  const bottomPanelElement = panelTemplates.content.querySelector<BottomPanelElement>("bottom-panel-element")!;
  const statusBar = topPanelElement.querySelector<StatusBarElement>("status-bar-element")!;
  const omnibox = topPanelElement.querySelector<OmniboxElement>("omnibox-element")!;
  const menu = topPanelElement.querySelector<OmnimenuElement>("omnimenu-element")!;
  const backlinks = bottomPanelElement.querySelector<BacklinksElement>("backlinks-element")!;

  const configKeyBindings = userConfig.keyBindings as CommandKeyBinding[];
  const library = { ...nativeCommands(), ...extendedCommands(proxy, omnibox, statusBar) };
  const keyBindings = getEditorKeyBindings(configKeyBindings, library);

  // ensure url
  if (!new URLSearchParams(location.search).get("path")) {
    window.history.replaceState(
      null,
      "",
      `${location.pathname}?draft&path=${encodeURIComponent(timestampToNotePath(new Date()))}`
    );
  }

  const editoView = initEditor({ topPanelElement, bottomPanelElement, keyBindings });
  initTopPanel(proxy, editoView, omnibox, menu, statusBar, configKeyBindings, library);
  initBottomPanel(proxy, backlinks);
  initContent(proxy, editoView);
}

main();

function initTopPanel(
  proxy: AsyncProxy<DataWorkerRoutes>,
  view: EditorView,
  omnibox: OmniboxElement,
  menu: OmnimenuElement,
  statusBar: StatusBarElement,
  bindings: CommandKeyBinding[],
  library: CommandLibrary
) {
  // request initial status
  proxy
    .fetch()
    .then(proxy.getStatus)
    .then((status) => statusEvents.dispatchEvent(new CustomEvent("status", { detail: status })));

  statusEvents.addEventListener("status", (e) => statusBar.setText((e as CustomEvent<string>).detail));

  omnibox.addEventListener("omnibox-input", async (e) => {
    const q = e.detail;
    if (q.startsWith(">")) {
      const command = q.slice(1).trim();
      const matchedCommands = bindings.filter((cmd) =>
        cmd.name.toLocaleLowerCase().startsWith(command.toLocaleLowerCase())
      );
      menu.setSuggestions(
        matchedCommands.map((command) => ({
          path: "TBD",
          title: `${[command.name, command.chord, command.key].filter(Boolean).join(" | ")}`,
        }))
      );
    } else if (q.length) {
      performance.mark("search-start");
      const files = await proxy.search({ query: e.detail, limit: 10 });
      menu.setSuggestions(files.map((file) => ({ path: file.path, title: file.meta.title ?? "Untitled" })));
      console.log(`[perf] search latency ${performance.measure("search", "search-start").duration.toFixed(2)}ms`);
    } else {
      performance.mark("load-recent-start");
      const files = await proxy.getRecentFiles();
      menu.setSuggestions(files.map((file) => ({ path: file.path, title: file.meta.title ?? "Untitled" })));
      console.log(
        `[perf] load recent latency ${performance.measure("search", "load-recent-start").duration.toFixed(2)}ms`
      );
    }
  });

  omnibox.addEventListener("omnibox-submit", (e) => {
    // TODO delegate execution using active selection from suggestion list
    const q = e.detail;
    if (q.startsWith(">")) {
      const commandQ = q.slice(1).trim();
      const matchedCommand = bindings.filter((cmd) =>
        cmd.name.toLocaleLowerCase().startsWith(commandQ.toLocaleLowerCase())
      )[0];

      const [namespace, commandName] = matchedCommand.run.split(".");
      const command = library[namespace]?.[commandName] as Command | undefined;

      omnibox.clear();
      menu.clear();
      view.focus();
      command?.(view);
    }
  });

  omnibox.addEventListener("omnibox-exit", () => {
    omnibox.clear();
    menu.clear();
    view.focus();
  });
}

function initBottomPanel(proxy: AsyncProxy<DataWorkerRoutes>, backlinks: BacklinksElement) {
  const path = new URLSearchParams(location.search).get("path");

  if (!path) {
    backlinks.setBacklinks([]);
  } else {
    proxy.getBacklinks(path).then((links) => {
      backlinks.setBacklinks(links);
    });
  }
}

interface InitEdidorConfig {
  topPanelElement: TopPanelElement;
  bottomPanelElement: BottomPanelElement;
  keyBindings: KeyBinding[];
}

function initEditor(config: InitEdidorConfig) {
  const { topPanelElement, bottomPanelElement, keyBindings } = config;
  const path = new URLSearchParams(location.search).get("path");
  const dotPos = path?.lastIndexOf(".");
  const ext = dotPos ? path?.slice(dotPos) : undefined;
  const extensions: Extension[] = [];

  if (ext === ".md") {
    extensions.push([
      liveLink(),
      history(),
      highlightActiveLine(),
      drawSelection(),
      dropCursor(),
      EditorView.lineWrapping,
      markdown({ extensions: { parseBlock: [frontmatterParser], defineNodes: defineYamlNodes() } }),
      topPanel(topPanelElement),
      bottomPanel(bottomPanelElement),
      oneDark,
      keymap.of(keyBindings),
    ]);
  } else if (ext === ".json") {
    extensions.push([
      history(),
      highlightActiveLine(),
      drawSelection(),
      dropCursor(),
      EditorView.lineWrapping,
      json(),
      topPanel(topPanelElement),
      oneDark,
      keymap.of(keyBindings),
    ]);
  }

  const view = new EditorView({
    doc: "",
    extensions,
    parent: document.getElementById("editor-root")!,
  });

  view.focus();
  return view;
}

function initContent(proxy: AsyncProxy<DataWorkerRoutes>, view: EditorView) {
  return loadInitialDoc(view, proxy);
}
