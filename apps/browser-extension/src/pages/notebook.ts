import { client, dedicatedWorkerHostPort } from "@tinykb/rpc-utils";
import { FocusTrapElement } from "../modules/editor/accessibility/focus-trap-element";
import { BacklinksElement } from "../modules/editor/menus/backlinks-element";

import {
  extendedCommands,
  getEditorBindings as getEditorKeyBindings,
  editorCommands as nativeCommands,
} from "../modules/editor/commands";
import { handleInitPanels, initEditor } from "../modules/editor/handle-init";
import { handleUpdate } from "../modules/editor/handle-update";
import { OmniboxElement } from "../modules/editor/menus/omnibox-element";
import { OmnimenuElement } from "../modules/editor/menus/omnimenu-element";
import { StatusBarElement } from "../modules/editor/status/status-bar-element";
import { RouterElement } from "../modules/router/router-element";
import { getKeyBindings, updateKeyBindings } from "../modules/settings/key-bindings";
import { timestampToId } from "../modules/sync/path";
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
  const router = document.querySelector<RouterElement>("router-element")!;
  const panelTemplates = document.querySelector<HTMLTemplateElement>("#panel-templates")!;
  const bottomPanelElement = panelTemplates.content.querySelector<HTMLElement>("#bottom-panel")!;
  const statusBar = bottomPanelElement.querySelector<StatusBarElement>("status-bar-element")!;
  const omnibox = document.querySelector<OmniboxElement>("omnibox-element")!;
  const omnimenu = document.querySelector<OmnimenuElement>("omnimenu-element")!;
  const backlinks = bottomPanelElement.querySelector<BacklinksElement>("backlinks-element")!;
  const dialog = document.querySelector<HTMLDialogElement>("#app-dialog")!;

  const onFilesChanged = () => {
    proxy.getStatus().then((status) => statusBar.setText(status));
    updateKeyBindings(proxy, () => window.alert("New key bindings available. Reload to apply."));
  };

  const library = {
    ...nativeCommands(),
    ...extendedCommands({ proxy, dialog, omnibox, onFilesChanged }),
  };
  const commandBindings = getKeyBindings();
  const editorBindings = getEditorKeyBindings(getKeyBindings(), library);

  // ensure url
  if (!new URLSearchParams(location.search).get("id")) {
    window.history.replaceState(null, "", `${location.pathname}?id=${encodeURIComponent(timestampToId(new Date()))}`);
  }

  // one-time setup per session
  const editorView = initEditor({
    bottomPanel: bottomPanelElement,
    editorBindings: editorBindings,
    router,
  });

  handleInitPanels({
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
  });

  handleUpdate({ proxy, backlinks, editorView });

  // route specific data loading
  router.addEventListener("router.change", () => {
    handleUpdate({ proxy, backlinks, editorView });
  });
}

main();
