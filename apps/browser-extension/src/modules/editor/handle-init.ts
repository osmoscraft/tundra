import { history } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import type { Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { drawSelection, dropCursor, highlightActiveLine, keymap, type KeyBinding } from "@codemirror/view";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import { EditorView } from "codemirror";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { RouterElement } from "../router/router-element";
import { noteIdToPath, timestampToId } from "../sync/path";
import type { BacklinksElement } from "./backlinks/backlinks-element";
import { defineYamlNodes } from "./code-mirror-ext/custom-tags";
import { frontmatterParser } from "./code-mirror-ext/frontmatter-parser";
import { liveLink } from "./code-mirror-ext/live-link";
import { bottomPanel, topPanel } from "./code-mirror-ext/panels";
import type { CommandKeyBinding, CommandLibrary } from "./commands";
import type { OmniboxElement } from "./menus/omnibox-element";
import { handleOmnimenuAction } from "./menus/omnimenu-action";
import type { OmnimenuElement } from "./menus/omnimenu-element";
import type { StatusBarElement } from "./status/status-bar-element";

export interface InitEdidorConfig {
  topPanel: HTMLElement;
  bottomPanel: HTMLElement;
  router: RouterElement;
  editorBindings: KeyBinding[];
}

export function initEditor(config: InitEdidorConfig) {
  const { topPanel: topPanelElement, bottomPanel: bottomPanelElement, router: routerElement, editorBindings } = config;
  const id = new URLSearchParams(location.search).get("id");
  // HACK, path only works for note files. JSON files requires different detection
  const path = id ? noteIdToPath(id) : undefined;
  const dotPos = path?.lastIndexOf(".");
  const ext = dotPos ? path?.slice(dotPos) : undefined;
  const extensions: Extension[] = [];

  if (ext === ".md") {
    extensions.push([
      liveLink(routerElement),
      history(),
      highlightActiveLine(),
      drawSelection(),
      dropCursor(),
      EditorView.lineWrapping,
      markdown({ extensions: { parseBlock: [frontmatterParser], defineNodes: defineYamlNodes() } }),
      topPanel(topPanelElement),
      bottomPanel(bottomPanelElement),
      oneDark,
      keymap.of(editorBindings),
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
      keymap.of(editorBindings),
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

export interface InitPanelsConfig {
  backlinks: BacklinksElement;
  commandBindings: CommandKeyBinding[];
  dialog: HTMLDialogElement;
  editorView: EditorView;
  library: CommandLibrary;
  omnibox: OmniboxElement;
  omnimenu: OmnimenuElement;
  proxy: AsyncProxy<DataWorkerRoutes>;
  router: RouterElement;
  statusBar: StatusBarElement;
  statusEvents: EventTarget;
}

export function handleInitPanels({
  backlinks,
  commandBindings,
  dialog,
  editorView,
  library,
  omnibox,
  omnimenu,
  proxy,
  router,
  statusBar,
  statusEvents,
}: InitPanelsConfig) {
  // request initial status
  proxy
    .fetch()
    .then(proxy.getStatus)
    .then((status) => statusEvents.dispatchEvent(new CustomEvent("status", { detail: status })));

  statusEvents.addEventListener("status", (e) => statusBar.setText((e as CustomEvent<string>).detail));

  backlinks.addEventListener("backlink.open", (e) => {});

  omnibox.addEventListener("omnibox.input", async (e) => {
    const q = e.detail;
    if (q.startsWith(">")) {
      const command = q.slice(1).trim();
      const matchedCommands = commandBindings.filter((cmd) =>
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
        view: editorView,
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
