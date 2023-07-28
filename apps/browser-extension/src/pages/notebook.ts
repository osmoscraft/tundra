import { history } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import type { Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, drawSelection, dropCursor, highlightActiveLine, keymap, type KeyBinding } from "@codemirror/view";
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
import { handleOmnimenuAction } from "../modules/editor/omnibox/omnimenu-action";
import { OmnimenuElement } from "../modules/editor/omnibox/omnimenu-element";
import { StatusBarElement } from "../modules/editor/status/status-bar-element";
import userConfig from "../modules/editor/user-config.json";
import { timestampToNotePath } from "../modules/sync/path";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./notebook.css";

customElements.define("status-bar-element", StatusBarElement);
customElements.define("omnibox-element", OmniboxElement);
customElements.define("omnimenu-element", OmnimenuElement);
customElements.define("backlinks-element", BacklinksElement);

const worker = new Worker("./data-worker.js", { type: "module" });
const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });
const statusEvents = new EventTarget();

function main() {
  const panelTemplates = document.querySelector<HTMLTemplateElement>("#panel-templates")!;
  const topPanelElement = panelTemplates.content.querySelector<HTMLElement>("#top-panel")!;
  const bottomPanelElement = panelTemplates.content.querySelector<HTMLElement>("#bottom-panel")!;
  const statusBarElement = topPanelElement.querySelector<StatusBarElement>("status-bar-element")!;
  const omniboxElement = document.querySelector<OmniboxElement>("omnibox-element")!;
  const omnimenuElement = document.querySelector<OmnimenuElement>("omnimenu-element")!;
  const backlinksElement = bottomPanelElement.querySelector<BacklinksElement>("backlinks-element")!;
  const dialogElement = document.querySelector<HTMLDialogElement>("#app-dialog")!;
  const configKeyBindings = userConfig.keyBindings as CommandKeyBinding[];
  const library = {
    ...nativeCommands(),
    ...extendedCommands(proxy, dialogElement, omniboxElement, statusBarElement),
  };
  const keyBindings = getEditorKeyBindings(configKeyBindings, library);

  // ensure url
  if (!new URLSearchParams(location.search).get("path")) {
    window.history.replaceState(
      null,
      "",
      `${location.pathname}?path=${encodeURIComponent(timestampToNotePath(new Date()))}`
    );
  }

  const editoView = initEditor({ topPanelElement, bottomPanelElement, keyBindings });
  initPanels(
    proxy,
    editoView,
    dialogElement,
    omniboxElement,
    omnimenuElement,
    statusBarElement,
    configKeyBindings,
    library,
    backlinksElement
  );
  initContent(proxy, editoView);
}

main();

function initPanels(
  proxy: AsyncProxy<DataWorkerRoutes>,
  view: EditorView,
  dialog: HTMLDialogElement,
  omnibox: OmniboxElement,
  omnimenu: OmnimenuElement,
  statusBar: StatusBarElement,
  bindings: CommandKeyBinding[],
  library: CommandLibrary,
  backlinks: BacklinksElement
) {
  // request initial status
  proxy
    .fetch()
    .then(proxy.getStatus)
    .then((status) => statusEvents.dispatchEvent(new CustomEvent("status", { detail: status })));

  statusEvents.addEventListener("status", (e) => statusBar.setText((e as CustomEvent<string>).detail));

  omnibox.addEventListener("omnibox.input", async (e) => {
    const q = e.detail;
    if (q.startsWith(">")) {
      const command = q.slice(1).trim();
      const matchedCommands = bindings.filter((cmd) =>
        cmd.name.toLocaleLowerCase().startsWith(command.toLocaleLowerCase())
      );
      omnimenu.setMenuItems(
        matchedCommands.map((command) => ({
          title: `${[command.name, command.chord, command.key].filter(Boolean).join(" | ")}`,
          state: { command: command.run },
        }))
      );
    } else {
      const isLinking = q.startsWith(":");
      const searchTerms = isLinking ? q.slice(1).trim() : q.trim();

      if (searchTerms.length) {
        performance.mark("search-start");
        const files = await proxy.search({ query: searchTerms, limit: 20 });
        const newNotePath = timestampToNotePath(new Date());

        omnimenu.setMenuItems([
          {
            title: `Create "${searchTerms}"`,
            state: { path: newNotePath, draft: true, title: searchTerms, linkTo: isLinking ? newNotePath : undefined },
          },
          ...files.map((file) => ({
            title: file.meta.title ?? "Untitled",
            state: {
              title: file.meta.title ?? "Untitled",
              path: file.path,
              linkTo: isLinking ? file.path : undefined,
            },
          })),
        ]);
        console.log(`[perf] search latency ${performance.measure("search", "search-start").duration.toFixed(2)}ms`);
      } else {
        performance.mark("load-recent-start");
        const files = await proxy.getRecentFiles();
        omnimenu.setMenuItems(
          files.map((file) => ({
            title: file.meta.title ?? "Untitled",
            state: { path: file.path, title: file.meta.title ?? "Untitled", linkTo: isLinking ? file.path : undefined },
          }))
        );
        console.log(
          `[perf] load recent latency ${performance.measure("search", "load-recent-start").duration.toFixed(2)}ms`
        );
      }
    }
  });

  omnimenu.addEventListener("omnimenu.action", (e) =>
    handleOmnimenuAction(
      {
        dialog,
        omnibox,
        omnimenu,
        view,
        library,
      },
      e.detail
    )
  );

  omnimenu.addEventListener("omnimenu.close", () => {
    omnibox.focus();
  });

  omnibox.addEventListener("omnibox.submit", (e) => {
    omnimenu.submitFirst(e.detail.submitMode);
  });

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
  topPanelElement: HTMLElement;
  bottomPanelElement: HTMLElement;
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
