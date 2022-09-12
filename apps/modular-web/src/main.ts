import { getForm, tapOnCommand } from "./features/command/command";
import "./features/console/console";
import { log } from "./features/console/console";

import "./features/console/console.css";
import { preventDefault } from "./utils/events";
import { closestForm, formData, getFormField, resetForm } from "./utils/form";

export default function main() {
  const commandDialog = document.getElementById("command-dialog") as HTMLDialogElement;
  const commandForm = document.getElementById("command-form") as HTMLFormElement;
  const consoleElement = document.getElementById("console") as HTMLOutputElement;

  const logToConsole = log.bind(null, consoleElement);
  const handleCommandSubmit = (e: Event) => tapOnCommand(getForm(preventDefault(e)), logToConsole).reset();

  const handleCommandSuggest = (e: Event) => {
    getFormField("comand", formData(closestForm(e.target as Element)!)) as string;
  };

  commandForm.addEventListener("submit", handleCommandSubmit);
  commandForm.addEventListener("input", handleCommandSuggest);

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyK" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      preventDefault(e);
      commandDialog.showModal();
      resetForm(commandForm);
    }
  });
}

main();
