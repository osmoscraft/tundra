import { getKeygram } from "./features/keyboard/shortcuts";
import "./main.css";
import { CommandPaletteElement } from "./modules/command/command-palette-element";
import { ConfigElement } from "./modules/config/config-element";
import { DialogElement } from "./modules/modal/dialog-element";
import { FocusTrapElement } from "./modules/modal/focus-trap-element";
import { $ } from "./utils/dom/query";

customElements.define("focus-trap-element", FocusTrapElement);
customElements.define("dialog-element", DialogElement);
customElements.define("config-element", ConfigElement);
customElements.define("command-palette-element", CommandPaletteElement);

async function main() {
  const dialog$ = $<DialogElement>("dialog-element")!;

  window.addEventListener("keydown", (e) => {
    const keygram = getKeygram(e);
    switch (keygram) {
      case "Ctrl-K":
        e.preventDefault();
        dialog$.show($<HTMLTemplateElement>("#command-dialog")!.content.cloneNode(true));
        return;
    }
  });

  window.addEventListener("command.run", (e) => {
    switch ((e as CustomEvent).detail) {
      case "config open":
        dialog$.show($<HTMLTemplateElement>("#config-dialog")!.content.cloneNode(true));
        break;
      case "file sync":
        break;
    }
  });
}

main();
