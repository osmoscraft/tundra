import { history } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import type { Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { drawSelection, dropCursor, highlightActiveLine, keymap, type KeyBinding } from "@codemirror/view";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import { EditorView } from "codemirror";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { RouterElement } from "../router/router-element";
import { timestampToId } from "../sync/path";
import { defineYamlNodes } from "./code-mirror-ext/custom-tags";
import { frontmatterParser } from "./code-mirror-ext/frontmatter-parser";
import { isAbsoluteUrl, liveLink } from "./code-mirror-ext/live-link";
import { bottomPanel } from "./code-mirror-ext/panels";
import type { CommandKeyBinding, CommandLibrary } from "./commands";
import type { BacklinksElement } from "./menus/backlinks-element";
import { handleMenuAction, type MenuAction } from "./menus/menu-action";
import type { OmniboxElement } from "./menus/omnibox-element";
import type { OmnimenuElement } from "./menus/omnimenu-element";
import type { StatusBarElement } from "./status/status-bar-element";

export interface InitEdidorConfig {
  bottomPanel: HTMLElement;
  router: RouterElement;
  editorBindings: KeyBinding[];
}

export function initEditor(config: InitEdidorConfig) {
  const { bottomPanel: bottomPanelElement, router: routerElement, editorBindings } = config;
  const extensions: Extension[] = [
    liveLink(routerElement),
    history(),
    highlightActiveLine(),
    drawSelection(),
    dropCursor(),
    EditorView.lineWrapping,
    markdown({ extensions: { parseBlock: [frontmatterParser], defineNodes: defineYamlNodes() } }),
    bottomPanel(bottomPanelElement),
    oneDark,
    keymap.of(editorBindings),
  ];

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

export function initPanels({
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
      const searchUrl = isAbsoluteUrl(searchTerms) ? searchTerms : undefined;

      if (searchTerms.length) {
        performance.mark("search-start");
        const notes = await proxy.searchNotes({ query: searchTerms, limit: 20 });
        const newNoteId = timestampToId(new Date());
        const newNoteUrl = searchUrl ? searchUrl : undefined;
        const newNoteTitle = searchUrl ? "Untitled" : searchTerms;
        const linkToId = isLinking && !searchUrl ? newNoteId : undefined;
        const linkToUrl = isLinking && searchUrl ? searchUrl : undefined;

        omnimenu.setMenuItems([
          {
            title: `(New) ${searchTerms}`,
            state: { id: newNoteId, url: newNoteUrl, title: newNoteTitle, linkToId, linkToUrl },
          },
          ...notes.map((file) => ({
            title: file.meta?.title ?? "Untitled",
            state: {
              title: file.meta?.title ?? "Untitled",
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
            title: note.meta?.title ?? "Untitled",
            state: {
              id: note.id,
              title: note.meta?.title ?? "Untitled",
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

  omnimenu.addEventListener("omnimenu.back", () => {
    omnibox.focus();
  });

  const menuActionHandler = (e: CustomEvent<MenuAction>) =>
    handleMenuAction({ dialog, omnibox, view: editorView, library, router }, e.detail);

  omnimenu.addEventListener("omnimenu.action", menuActionHandler);
  omnimenu.addEventListener("omnimenu.action", () => dialog.close());

  backlinks.addEventListener("backlinks.open", menuActionHandler);

  omnibox.addEventListener("omnibox.submit", (e) => {
    omnimenu.submitFirst(e.detail.submitMode);
  });
}
