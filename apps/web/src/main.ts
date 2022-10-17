import commanderHtml from "./features/shell/commander.html?raw";
import { closeDialog, openDialog } from "./features/shell/dialog";
import { handleShortcuts } from "./features/shell/keyboard";
import { emit, on, preventDefault } from "./utils/event";
import { pipe } from "./utils/functional/pipe";
import { applyProp, setProp } from "./utils/object";
import { $ } from "./utils/query";
import { cloneTemplate, template } from "./utils/render";

export async function main() {
  // Commander module
  const knownCommands = ["fs.save", "fs.sync"];
  const commanderTemplate = template(commanderHtml);
  on("shell.execCommand", (e) => {
    switch (e.detail) {
      case "shell.openCommander":
        const fragment$ = cloneTemplate(commanderTemplate);
        const suggestionList$ = $("ul", fragment$)!;
        const renderSuggestions = (items: string[]) => items.map((item) => `<li>${item}</li>`).join("");

        on(
          "input",
          pipe(
            (e: Event) => (e.target as HTMLInputElement).value,
            (v: string) => knownCommands.filter(applyProp("includes", [v])),
            renderSuggestions,
            (html: string) => setProp("innerHTML", html, suggestionList$)
          )
        )($("input", fragment$)!);
        setProp("innerHTML", renderSuggestions(knownCommands), suggestionList$);

        // TODO process command submit
        on("submit", pipe(preventDefault))($("form", fragment$)!);

        emit("shell.openDialog", { detail: { fragment: fragment$ } })(window);
        break;
      default:
        emit(e.detail, {})(window);
        break;
    }
  })(window);

  // Keyboard module
  on("keydown", handleShortcuts([["Ctrl+P", "shell.openCommander"]]))(window);

  // Dialog module
  on("shell.openDialog", (e) => openDialog(e.detail.fragment)($("dialog")))(window);
  on("shell.closeDialog", () => closeDialog()($("dialog")))(window);
}

main();
