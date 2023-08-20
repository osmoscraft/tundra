import type { AsyncProxy } from "@tinykb/rpc-utils";
import { EditorView } from "codemirror";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { RouterElement } from "../router/router-element";
import type { CommandKeyBinding, CommandLibrary } from "./commands";
import type { BacklinksElement } from "./menus/backlinks-element";
import { handleMenuInput } from "./menus/handle-menu-input";
import { handleMenuAction } from "./menus/menu-action";
import type { OmniboxElement } from "./menus/omnibox-element";
import type { OmnimenuElement } from "./menus/omnimenu-element";
import type { StatusBarElement } from "./status/status-bar-element";

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
  backlinks.addEventListener("backlinks.back", () => {
    editorView.focus();
  });
}
