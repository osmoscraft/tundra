import { getForm, preventDefault, reset, tapOnCommand } from "./features/command/command";
import "./features/console/console";
import { log } from "./features/console/console";

import "./features/console/console.css";

export default function main() {
  const commandDialog = document.getElementById("command-dialog") as HTMLDialogElement;
  const commandForm = document.getElementById("command-form") as HTMLFormElement;
  const console = document.querySelector<HTMLOutputElement>("output")!;

  const logToConsole = log.bind(null, console);
  const handleCommandSubmit = (e: Event) => tapOnCommand(getForm(preventDefault(e)), logToConsole).reset();

  commandForm.addEventListener("submit", handleCommandSubmit);

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyK" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      preventDefault(e);
      commandDialog.showModal();
      reset(commandForm);
    }
  });
}

main();
