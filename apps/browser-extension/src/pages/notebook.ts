import { history } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  keymap,
  type Command,
  type KeyBinding,
} from "@codemirror/view";
import { client, dedicatedWorkerHostPort, server, type AsyncProxy } from "@tinykb/rpc-utils";
import { defineYamlNodes } from "../modules/editor/code-mirror-ext/custom-tags";
import { frontmatterParser } from "../modules/editor/code-mirror-ext/frontmatter-parser";
import { liveLink } from "../modules/editor/code-mirror-ext/live-link";
import { systemBar } from "../modules/editor/code-mirror-ext/system-bar";
import {
  extendedCommands,
  getEditorBindings as getEditorKeyBindings,
  editorCommands as nativeCommands,
  type CommandKeyBinding,
  type CommandLibrary,
} from "../modules/editor/commands";
import { loadInitialDoc } from "../modules/editor/load-initial-doc";
import { OmniboxElement } from "../modules/editor/omnibox/omnibox-element";
import { StatusBarElement } from "../modules/editor/status/status-bar-element";
import { OmnimenuElement } from "../modules/editor/suggestion-list/omnimenu-element";
import userConfig from "../modules/editor/user-config.json";
import { SystemBarElement } from "../modules/system-bar/system-bar-element";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./notebook.css";

customElements.define("status-bar-element", StatusBarElement);
customElements.define("omnibox-element", OmniboxElement);
customElements.define("omnimenu-element", OmnimenuElement);
customElements.define("system-bar-element", SystemBarElement);

const worker = new Worker("./data-worker.js", { type: "module" });

const statusEvents = new EventTarget();

export type NotebookRoutes = typeof routes;
const routes = {
  setStatus: (text: string) => statusEvents.dispatchEvent(new CustomEvent("status", { detail: text })),
};

server({ routes, port: dedicatedWorkerHostPort(worker) });
const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });

function main() {
  const systemBarElement = document
    .querySelector<HTMLTemplateElement>("#system-bar-template")!
    .content.querySelector<SystemBarElement>("system-bar-element")!;
  const statusBar = systemBarElement.querySelector<StatusBarElement>("status-bar-element")!;
  const omnibox = systemBarElement.querySelector<OmniboxElement>("omnibox-element")!;
  const menu = systemBarElement.querySelector<OmnimenuElement>("omnimenu-element")!;

  const configKeyBindings = userConfig.keyBindings as CommandKeyBinding[];
  const library = { ...nativeCommands(), ...extendedCommands(proxy, omnibox) };
  const bindings = getEditorKeyBindings(configKeyBindings, library);

  const editoView = initEditor(systemBarElement, bindings);
  initSystemBar(proxy, editoView, omnibox, menu, statusBar, configKeyBindings, library);
  initContent(proxy, editoView);
}

main();

function initSystemBar(
  proxy: AsyncProxy<DataWorkerRoutes>,
  view: EditorView,
  omnibox: OmniboxElement,
  menu: OmnimenuElement,
  statusBar: StatusBarElement,
  bindings: CommandKeyBinding[],
  library: CommandLibrary
) {
  statusEvents.addEventListener("status", (e) => statusBar.setText((e as CustomEvent<string>).detail));

  omnibox.addEventListener("omnibox-input", async (e) => {
    const q = e.detail;
    if (q.startsWith(">")) {
      const command = q.slice(1).trim();
      const matchedCommands = bindings.filter((cmd) =>
        cmd.name.toLocaleLowerCase().startsWith(command.toLocaleLowerCase())
      );
      menu.setSuggestions(
        matchedCommands.map((command) => ({
          path: "TBD",
          title: `${[command.name, command.chord, command.key].filter(Boolean).join(" | ")}`,
        }))
      );
    } else if (q.length) {
      performance.mark("search-start");
      const files = await proxy.search({ query: e.detail, limit: 10 });
      menu.setSuggestions(files.map((file) => ({ path: file.path, title: file.meta.title ?? "Untitled" })));
      console.log(`[perf] search latency ${performance.measure("search", "search-start").duration.toFixed(2)}ms`);
    } else {
      performance.mark("load-recent-start");
      const files = await proxy.getRecentFiles();
      menu.setSuggestions(files.map((file) => ({ path: file.path, title: file.meta.title ?? "Untitled" })));
      console.log(
        `[perf] load recent latency ${performance.measure("search", "load-recent-start").duration.toFixed(2)}ms`
      );
    }
  });

  omnibox.addEventListener("omnibox-submit", (e) => {
    // TODO delegate execution using active selection from suggestion list
    const q = e.detail;
    if (q.startsWith(">")) {
      const commandQ = q.slice(1).trim();
      const matchedCommand = bindings.filter((cmd) =>
        cmd.name.toLocaleLowerCase().startsWith(commandQ.toLocaleLowerCase())
      )[0];

      const [namespace, commandName] = matchedCommand.run.split(".");
      const command = library[namespace]?.[commandName] as Command | undefined;

      omnibox.clear();
      menu.clear();
      view.focus();
      command?.(view);
    }
  });

  omnibox.addEventListener("omnibox-exit", () => {
    omnibox.clear();
    menu.clear();
    view.focus();
  });
}

function initEditor(systemBarElement: SystemBarElement, keyBindings: KeyBinding[]) {
  const view = new EditorView({
    doc: "",
    extensions: [
      liveLink(),
      history(),
      highlightActiveLine(),
      drawSelection(),
      dropCursor(),
      EditorView.lineWrapping,
      markdown({ extensions: { parseBlock: [frontmatterParser], defineNodes: defineYamlNodes() } }),
      systemBar(systemBarElement),
      oneDark,
      keymap.of(keyBindings),
    ],
    parent: document.getElementById("editor-root")!,
  });

  view.focus();
  return view;
}

function initContent(proxy: AsyncProxy<DataWorkerRoutes>, view: EditorView) {
  return loadInitialDoc(view, proxy);
}
