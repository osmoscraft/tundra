import { htmlToMarkdown, markdownToHtml } from "@tinykb/haiku-codec";
import { HaikuEditorElement } from "@tinykb/haiku-editor";
import "@tinykb/haiku-editor/haiku-editor.css";
import "./main.css";
import type { Command } from "./modules/command/command";
import { commandRunEvent } from "./modules/command/command-events";
import { CommandPaletteElement } from "./modules/command/command-palette-element";
import { ConfigElement } from "./modules/config/config-element";
import { storesTx } from "./modules/db/db";
import { dbAsync } from "./modules/db/instance";
import { getRemote } from "./modules/db/queries";
import { getKeygram } from "./modules/keyboard/shortcuts";
import { DialogElement } from "./modules/modal/dialog-element";
import { FocusTrapElement } from "./modules/modal/focus-trap-element";
import { routeAfterChangeEvent, RouterElement } from "./modules/router/router";
import { testConnection } from "./modules/sync/sync";
import { TerminalElement, termWriteEvent } from "./modules/terminal/terminal-element";
import { $ } from "./utils/dom/query";

customElements.define("command-palette-element", CommandPaletteElement);
customElements.define("config-element", ConfigElement);
customElements.define("dialog-element", DialogElement);
customElements.define("focus-trap-element", FocusTrapElement);
customElements.define("router-element", RouterElement);
customElements.define("haiku-editor-element", HaikuEditorElement);
customElements.define("terminal-element", TerminalElement);

async function main() {
  const router$ = $<RouterElement>("router-element")!;
  const dialog$ = $<DialogElement>("dialog-element")!;
  const editor$ = $<HaikuEditorElement>("haiku-editor-element")!;
  const terminal$ = $<TerminalElement>("terminal-element")!;
  const log = terminal$.write.bind(terminal$);

  const systemCommands: Command[] = [
    {
      key: "command.openPalette",
      description: "Open command palette",
      hidden: true,
      action: () => {
        dialog$.show($<HTMLTemplateElement>("#command-dialog")!.content.cloneNode(true));
        $<CommandPaletteElement>("command-palette-element")!.start(systemCommands);
      },
      shortcuts: [{ keygram: "Ctrl+P" }],
    },
    {
      key: "config.openDialog",
      description: "Open config dialog",
      action: () => dialog$.show($<HTMLTemplateElement>("#config-dialog")!.content.cloneNode(true)),
    },
    {
      key: "term.toggle",
      description: "Expand/collapse the terminal",
      action: () => terminal$.toggle(),
      shortcuts: [{ keygram: "Ctrl+`" }],
    },
    {
      key: "fs.syncAll",
      description: "Sync changes in all files",
      action: () => terminal$.write("Not implemented"),
      shortcuts: [{ keygram: "Ctrl+Shift+S" }],
    },
    {
      key: "fs.save",
      description: "Save changes in the current files",
      action: async () => {
        const md = htmlToMarkdown(editor$.getHtml());
        const db = await dbAsync;
        storesTx(db, ["frame"], "readwrite", ([frameStore]) => frameStore.put({ id: 123, content: md }));
      },
      shortcuts: [{ keygram: "Ctrl+S" }],
    },
    {
      key: "fs.remote.test",
      description: "Test connection to remote repo",
      action: async () => {
        const db = await dbAsync;
        const remote = await getRemote(db);
        if (!remote) {
          terminal$.write("Remote is not configured.");
          return;
        }

        testConnection(remote.connection, log);
      },
    },
    {
      key: "fs.remote.clone",
      description: "Clone remote repo",
      action: async () => {},
    },
  ];

  window.addEventListener("keydown", async (e) => {
    const keygram = getKeygram(e);
    const matchedCommand = systemCommands.find((command) => command.shortcuts?.[0]?.keygram === keygram);
    if (!matchedCommand) return;

    e.preventDefault();
    matchedCommand.action();
  });

  termWriteEvent.on(window, async (e) => terminal$.write(e.detail));
  commandRunEvent.on(window, async (e) => systemCommands.find((command) => command.key === e.detail)?.action());

  routeAfterChangeEvent.on(window, () => {
    const id = new URLSearchParams(location.search).get("id");
    if (id === "new" || !id) {
      const mutableUrl = new URL(location.href);
      mutableUrl.search = new URLSearchParams({ id: Math.random().toString() }).toString();
      router$.replaceUrl(mutableUrl.href);
      return;
    }

    // load content from DB
    editor$.setHtml(markdownToHtml("- hello world"));
  });

  router$.start();
}

main();
