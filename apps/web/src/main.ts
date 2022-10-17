import commanderHtml from "./features/shell/commander.html?raw";
import { closeDialog, openDialog } from "./features/shell/dialog";
import { handleShortcuts } from "./features/shell/keyboard";
import { emit, on } from "./utils/event";
import { pipe } from "./utils/functional/pipe";
import { setProp } from "./utils/object";
import { $ } from "./utils/query";
import { cloneTemplate, template } from "./utils/render";

export async function main() {
  // Commander module
  const knownCommands = ["fs.save", "fs.sync"];
  const commanderTemplate = template(commanderHtml);
  window.addEventListener("shell.execCommand", (e) => {
    switch (e.detail) {
      case "shell.openCommander":
        const fragment$ = cloneTemplate(commanderTemplate);
        const suggestionList$ = $("ul", fragment$)!;

        setProp("innerHTML", knownCommands.map((item) => `<li>${item}</li>`).join(""), suggestionList$);
        on(
          "keydown",
          pipe(
            (e: KeyboardEvent) => (e.target as HTMLInputElement).value,
            (v: string) => knownCommands.filter((item) => item.includes(v)),
            (items: string[]) => items.map((item) => `<li>${item}</li>`).join(""),
            (html: string) => setProp("innerHTML", html, suggestionList$)
          )
        )($("input", fragment$)!);
        emit("shell.openDialog", { detail: { fragment: fragment$ } })(window);
        break;
      default:
        emit(e.detail, {})(window);
        break;
    }
  });

  // Keyboard module
  window.addEventListener("keydown", handleShortcuts([["Ctrl+P", "shell.openCommander"]]));

  // Dialog module
  window.addEventListener("shell.openDialog", (e) => openDialog(e.detail.fragment)($("dialog")));
  window.addEventListener("shell.closeDialog", () => closeDialog()($("dialog")));
}

main();
