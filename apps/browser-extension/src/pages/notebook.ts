import { client, dedicatedWorkerHostPort } from "@tundra/rpc-utils";
import { FocusTrapElement } from "../modules/editor/accessibility/focus-trap-element";
import { BacklinksElement } from "../modules/editor/menus/backlinks-element";

import { bufferChangeManager } from "../modules/editor/code-mirror-ext/buffer-change-manager";
import { focusWatcher } from "../modules/editor/code-mirror-ext/focus-watcher";
import { editorCommand, extendedCommands, getEditorKeyBindings } from "../modules/editor/commands";
import { initEditor } from "../modules/editor/init-editor";
import { initPanels } from "../modules/editor/init-panels";
import { initRoute } from "../modules/editor/init-route";
import { OmniboxElement } from "../modules/editor/menus/omnibox-element";
import { OmnimenuElement } from "../modules/editor/menus/omnimenu-element";
import { HudElement } from "../modules/editor/status/hud-element";
import { StatusBarElement } from "../modules/editor/status/status-bar-element";
import { createTabsetByChannel } from "../modules/editor/tabs/create-tabset";
import type { TabMessage } from "../modules/editor/tabs/tab-message";
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

// event setup
const tabset = createTabsetByChannel<TabMessage>(new BroadcastChannel("tabset"));
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
    preventDirtyUnload,
  } = bufferChangeManager({ onChange: (base, head) => hud.trackChange(base, head) });

  router.addEventListener("router.afterunload", preventDirtyUnload);
  window.addEventListener("beforeunload", preventDirtyUnload);

  const library = {
    ...editorCommand(),
    ...extendedCommands({ proxy, dialog, omnibox, onGraphChanged: () => router.reload(), statusEvents, tabset }),
  };
  const commandBindings = getKeyBindings();
  const editorBindings = getEditorKeyBindings(commandBindings, library);

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
    tabset,
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
