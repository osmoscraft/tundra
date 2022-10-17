import commanderTemplate from "./features/shell/commander.html?raw";
import { closeDialog, openDialog } from "./features/shell/dialog";
import { handleShortcuts } from "./features/shell/keyboard";
import { emit } from "./utils/event";
import { $ } from "./utils/query";

export async function main() {
  // Commander module
  window.addEventListener("shell.execCommand", (e) => {
    switch (e.detail) {
      case "shell.openCommander":
        emit("shell.openDialog", { detail: { templateHtml: commanderTemplate } })(window);
        break;
      default:
        emit(e.detail, {})(window);
        break;
    }
  });

  // Keyboard module
  window.addEventListener("keydown", handleShortcuts([["Ctrl+P", "shell.openCommander"]]));

  // Dialog module
  window.addEventListener("shell.openDialog", (e) => openDialog(e.detail.templateHtml)($("dialog")));
  window.addEventListener("shell.closeDialog", () => closeDialog()($("dialog")));
}

main();
