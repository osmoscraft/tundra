import { htmlToMarkdown, markdownToHtml } from "@tinykb/haiku-codec";
import { HaikuEditorElement } from "@tinykb/haiku-editor";
import "@tinykb/haiku-editor/haiku-editor.css";
import "./main.css";
import { commandRunEvent } from "./modules/command/command-events";
import { CommandPaletteElement } from "./modules/command/command-palette-element";
import { ConfigElement } from "./modules/config/config-element";
import { getKeygram } from "./modules/keyboard/shortcuts";
import { DialogElement } from "./modules/modal/dialog-element";
import { FocusTrapElement } from "./modules/modal/focus-trap-element";
import { routeAfterChangeEvent, RouterElement } from "./modules/router/router";
import { $ } from "./utils/dom/query";

customElements.define("command-palette-element", CommandPaletteElement);
customElements.define("config-element", ConfigElement);
customElements.define("dialog-element", DialogElement);
customElements.define("focus-trap-element", FocusTrapElement);
customElements.define("router-element", RouterElement);
customElements.define("haiku-editor-element", HaikuEditorElement);

async function main() {
  const router$ = $<RouterElement>("router-element")!;
  const dialog$ = $<DialogElement>("dialog-element")!;
  const editor$ = $<HaikuEditorElement>("haiku-editor-element")!;

  window.addEventListener("keydown", (e) => {
    const keygram = getKeygram(e);
    switch (keygram) {
      case "Ctrl-K":
        e.preventDefault();
        dialog$.show($<HTMLTemplateElement>("#command-dialog")!.content.cloneNode(true));
        break;
      case "Ctrl-S":
        e.preventDefault();
        console.log("Will save md:", htmlToMarkdown(editor$.getHtml()));
        break;
    }
  });

  commandRunEvent.on(window, (e) => {
    switch (e.detail) {
      case "config open":
        dialog$.show($<HTMLTemplateElement>("#config-dialog")!.content.cloneNode(true));
        break;
      case "file sync":
        break;
    }
  });

  routeAfterChangeEvent.on(window, () => {
    const id = new URLSearchParams(location.search).get("id");
    if (id === "new") {
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
