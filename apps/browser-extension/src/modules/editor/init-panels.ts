import type { AsyncProxy } from "@tundra/rpc-utils";
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
import type { Tabset } from "./tabs/create-tabset";
import type { TabMessage } from "./tabs/tab-message";

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
  tabset: Tabset<TabMessage>;
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
  tabset,
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
    handleMenuAction({ proxy, omnibox, view: editorView, library, router, tabset }, e.detail);
    dialog.close();
  });

  backlinks.addEventListener("backlinks.open", (e) => {
    handleMenuAction({ proxy, omnibox, view: editorView, library, router, tabset }, e.detail);
  });
  backlinks.addEventListener("backlinks.back", () => {
    editorView.focus();
  });
}
