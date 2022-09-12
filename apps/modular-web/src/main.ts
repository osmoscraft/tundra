import { createSuggester, getForm, tapOnCommand } from "./features/command/command";
import "./features/console/console";
import { log } from "./features/console/console";

import "./features/console/console.css";
import { getAppDB } from "./features/db/db";
import { getRecentFrames } from "./features/db/queries";
import { preventDefault } from "./utils/events";
import { closestForm, formData, getFormField, resetForm } from "./utils/form";
import { ensureUrlParam } from "./utils/url";

export default async function main() {
  if (!ensureUrlParam(new URL(location.href), "frame", "new")) return;

  const db = await getAppDB();

  const commandDialog = document.getElementById("command-dialog") as HTMLDialogElement;
  const commandForm = document.getElementById("command-form") as HTMLFormElement;
  const commandSuggestions = document.getElementById("command-suggestions") as HTMLUListElement;
  const consoleElement = document.getElementById("console") as HTMLOutputElement;

  const getRecentFrameSuggestions = async () => (await getRecentFrames(db, 10)).map((item) => `<a href="#">${item.id}</a>`);
  const logToConsole = log.bind(null, consoleElement);
  const handleCommandSubmit = (e: Event) => tapOnCommand(getForm(preventDefault(e)), logToConsole).reset();

  const suggest = createSuggester([
    async (command) => (!command.length ? await getRecentFrameSuggestions() : []),
    async (command) => (command.length && "sandbox".startsWith(command) ? [`<a href="/sandbox.html">Open editor sandbox</a>`] : []),
  ]);

  const getCommand = (e: Event) => getFormField("command", formData(closestForm(e.target as Element)!)) as string;
  const handleCommandSuggest = async (command: string) => {
    commandSuggestions.innerHTML = (await suggest(command)).map((item) => `<li>${item}</li>`).join("");
  };

  commandForm.addEventListener("submit", handleCommandSubmit);
  commandForm.addEventListener("input", (e) => handleCommandSuggest(getCommand(e)));

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyK" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      preventDefault(e);
      resetForm(commandForm);
      handleCommandSuggest("");
      commandDialog.showModal();
    }
  });
}

main();
