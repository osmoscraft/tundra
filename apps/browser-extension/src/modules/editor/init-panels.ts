import { history } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import type { Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { drawSelection, dropCursor, highlightActiveLine, keymap, type KeyBinding } from "@codemirror/view";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import { EditorView } from "codemirror";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { RouterElement } from "../router/router-element";
import { defineYamlNodes } from "./code-mirror-ext/custom-tags";
import { frontmatterParser } from "./code-mirror-ext/frontmatter-parser";
import { liveLink } from "./code-mirror-ext/live-link";
import { bottomPanel, topPanel } from "./code-mirror-ext/panels";
import type { CommandKeyBinding, CommandLibrary } from "./commands";
import type { BacklinksElement } from "./menus/backlinks-element";
import { handleMenuInput } from "./menus/handle-menu-input";
import { handleMenuAction } from "./menus/menu-action";
import type { OmniboxElement } from "./menus/omnibox-element";
import type { OmnimenuElement } from "./menus/omnimenu-element";
import type { StatusBarElement } from "./status/status-bar-element";

export interface InitEdidorConfig {
  topPanel: HTMLElement;
  bottomPanel: HTMLElement;
  router: RouterElement;
  editorBindings: KeyBinding[];
  bufferChangeManagerExtension: Extension;
}

export function initEditor(config: InitEdidorConfig) {
  const {
    topPanel: topPanelElement,
    bottomPanel: bottomPanelElement,
    router: routerElement,
    editorBindings,
    bufferChangeManagerExtension,
  } = config;
  const extensions: Extension[] = [
    bufferChangeManagerExtension,
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

  omnibox.addEventListener("omnibox.input", (e) => handleMenuInput({ commandBindings, omnimenu, proxy }, e));
  omnibox.addEventListener("omnibox.submit", (e) => {
    omnimenu.submitFirst(e.detail.submitMode);
  });

  omnimenu.addEventListener("omnimenu.back", () => {
    omnibox.focus();
  });

  omnimenu.addEventListener("omnimenu.action", (e) => {
    handleMenuAction({ proxy, omnibox, view: editorView, library, router }, e.detail);
    dialog.close();
  });

  backlinks.addEventListener("backlinks.open", (e) => {
    handleMenuAction({ proxy, omnibox, view: editorView, library, router }, e.detail);
  });
}
