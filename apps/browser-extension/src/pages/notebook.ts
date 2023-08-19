import { client, dedicatedWorkerHostPort } from "@tinykb/rpc-utils";
import { FocusTrapElement } from "../modules/editor/accessibility/focus-trap-element";
import { BacklinksElement } from "../modules/editor/menus/backlinks-element";

import { bufferChangeManager } from "../modules/editor/code-mirror-ext/buffer-change-manager";
import { focusWatcher } from "../modules/editor/code-mirror-ext/focus-watcher";
import {
  extendedCommands,
  getEditorBindings as getEditorKeyBindings,
  editorCommands as nativeCommands,
} from "../modules/editor/commands";
import { initEditor, initPanels } from "../modules/editor/init-panels";
import { initRoute } from "../modules/editor/init-route";
import { OmniboxElement } from "../modules/editor/menus/omnibox-element";
import { OmnimenuElement } from "../modules/editor/menus/omnimenu-element";
import { HudElement } from "../modules/editor/status/hud-element";
import { StatusBarElement } from "../modules/editor/status/status-bar-element";
import { RouterElement } from "../modules/router/router-element";
import { getKeyBindings } from "../modules/settings/key-bindings";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./notebook.css";

customElements.define("hud-element", HudElement);
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
  const topPanelElement = panelTemplates.content.querySelector<HTMLElement>("#top-panel")!;
  const hud = topPanelElement.querySelector<HudElement>("hud-element")!;
  const bottomPanelElement = panelTemplates.content.querySelector<HTMLElement>("#bottom-panel")!;
  const statusBar = bottomPanelElement.querySelector<StatusBarElement>("status-bar-element")!;
  const omnibox = document.querySelector<OmniboxElement>("omnibox-element")!;
  const omnimenu = document.querySelector<OmnimenuElement>("omnimenu-element")!;
  const backlinks = bottomPanelElement.querySelector<BacklinksElement>("backlinks-element")!;
  const dialog = document.querySelector<HTMLDialogElement>("#app-dialog")!;

  const {
    extension: bufferChangeManagerExtension,
    trackBufferChange,
    handleBeforeunload,
  } = bufferChangeManager({ onChange: (base, head) => hud.trackChange(base, head) });

  router.addEventListener("router.beforeunload", handleBeforeunload);
  window.addEventListener("beforeunload", handleBeforeunload);

  const library = {
    ...nativeCommands(),
    ...extendedCommands({ proxy, dialog, omnibox, onGraphChanged: () => router.reload() }),
  };
  const commandBindings = getKeyBindings();
  const editorBindings = getEditorKeyBindings(getKeyBindings(), library);

  const { extension: focusWatcherExtension } = focusWatcher({ onChange: (isFocused) => hud.setIsFocused(isFocused) });

  // one-time setup per session
  const editorView = initEditor({
    bufferChangeManagerExtension,
    focusWatcherExtension,
    topPanel: topPanelElement,
    bottomPanel: bottomPanelElement,
    editorBindings,
    router,
  });

  initPanels({
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

  // Init steps above this point must not depend on the URL
  const handleRouteChange = () => {
    return initRoute({
      proxy,
      backlinks,
      hud,
      editorView,
      url: location.href,
      statusEvents,
      trackBufferChange,
    });
  };

  router.addEventListener("router.change", async () => {
    await initialRouteLoad;
    handleRouteChange();
  });
  const initialRouteLoad = handleRouteChange();
}

main();
