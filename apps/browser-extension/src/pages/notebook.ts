import { history } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import type { Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, drawSelection, dropCursor, highlightActiveLine, keymap, type KeyBinding } from "@codemirror/view";
import { client, dedicatedWorkerHostPort, type AsyncProxy } from "@tinykb/rpc-utils";
import { FocusTrapElement } from "../modules/editor/accessibility/focus-trap-element";
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
import { OmniboxElement } from "../modules/editor/omnibox/omnibox-element";
import { handleOmnimenuAction } from "../modules/editor/omnibox/omnimenu-action";
import { OmnimenuElement } from "../modules/editor/omnibox/omnimenu-element";
import { StatusBarElement } from "../modules/editor/status/status-bar-element";
import userConfig from "../modules/editor/user-config.json";
import { paramsToRouteState } from "../modules/router/route-state";
import { RouterElement } from "../modules/router/router-element";
import { noteIdToPath, timestampToId } from "../modules/sync/path";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./notebook.css";

customElements.define("router-element", RouterElement);
customElements.define("status-bar-element", StatusBarElement);
customElements.define("omnibox-element", OmniboxElement);
customElements.define("omnimenu-element", OmnimenuElement);
customElements.define("backlinks-element", BacklinksElement);
customElements.define("focus-trap-element", FocusTrapElement);

const worker = new Worker("./data-worker.js", { type: "module" });
const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });
const statusEvents = new EventTarget();

function main() {
  const routerElement = document.querySelector<RouterElement>("router-element")!;
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
  if (!new URLSearchParams(location.search).get("id")) {
    window.history.replaceState(null, "", `${location.pathname}?id=${encodeURIComponent(timestampToId(new Date()))}`);
  }

  // one-time setup per session
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
    routerElement
  );
  initRouteContent(proxy, backlinksElement, editoView);

  // route specific data loading
  routerElement.addEventListener("router.change", () => {
    initRouteContent(proxy, backlinksElement, editoView);
  });
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
  router: RouterElement
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
        const notes = await proxy.searchNotes({ query: searchTerms, limit: 20 });
        const newNoteId = timestampToId(new Date());

        omnimenu.setMenuItems([
          {
            title: `(New) ${searchTerms}`,
            state: { id: newNoteId, title: searchTerms, linkToId: isLinking ? newNoteId : undefined },
          },
          ...notes.map((file) => ({
            title: file.meta.title ?? "Untitled",
            state: {
              title: file.meta.title ?? "Untitled",
              id: file.id,
              linkToId: isLinking ? file.id : undefined,
            },
          })),
        ]);
        console.log(`[perf] search latency ${performance.measure("search", "search-start").duration.toFixed(2)}ms`);
      } else {
        performance.mark("load-recent-start");
        const notes = await proxy.getRecentNotes();
        omnimenu.setMenuItems(
          notes.map((note) => ({
            title: note.meta.title ?? "Untitled",
            state: {
              id: note.id,
              title: note.meta.title ?? "Untitled",
              linkToId: isLinking ? note.id : undefined,
            },
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
        view,
        library,
        router,
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
}

interface InitEdidorConfig {
  topPanelElement: HTMLElement;
  bottomPanelElement: HTMLElement;
  keyBindings: KeyBinding[];
}

function initEditor(config: InitEdidorConfig) {
  const { topPanelElement, bottomPanelElement, keyBindings } = config;
  const id = new URLSearchParams(location.search).get("id");
  // HACK, path only works for note files. JSON files requires different detection
  const path = id ? noteIdToPath(id) : undefined;
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

async function initRouteContent(proxy: AsyncProxy<DataWorkerRoutes>, backlinks: BacklinksElement, view: EditorView) {
  const searchParams = new URLSearchParams(location.search);
  const state = paramsToRouteState(searchParams);
  const { id, title } = state;

  const file = id ? await proxy.getNote(id) : null;
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: file?.content ?? getDraftContent(title),
    },
  });

  if (!id) {
    backlinks.setBacklinks([]);
  } else {
    proxy.getBacklinks(id).then((links) => {
      backlinks.setBacklinks(links);
    });
  }
}

function getDraftContent(title?: string) {
  return `
---
title: ${title ?? "Untitled"}
---

- New item`.trim();
}
