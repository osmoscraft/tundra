import { createSuggester, getForm, tapOnCommand } from "./features/command/command";
import "./features/console/console";
import { log } from "./features/console/console";
import "./features/console/console.css";
import { getAppDB } from "./features/db/db";
import { getActiveFrame, getRecentFrames } from "./features/db/queries";
import { markdownToHtml } from "./features/editor/codec";
import { HaikuEditorElement } from "./features/editor/editor";
import "./features/editor/editor.css";
import { preventDefault } from "./utils/events";
import { closestForm, formData, getFormField, resetForm } from "./utils/form";
import { ensureUrlParam } from "./utils/url";

customElements.define("haiku-editor-element", HaikuEditorElement);

export default async function main() {
  const url = new URL(location.href);
  if (!ensureUrlParam(url, "frame", "new")) return;

  const db = await getAppDB();

  const editor = document.querySelector("haiku-editor-element") as HaikuEditorElement;
  const commandDialog = document.getElementById("command-dialog") as HTMLDialogElement;
  const commandForm = document.getElementById("command-form") as HTMLFormElement;
  const commandSuggestions = document.getElementById("command-suggestions") as HTMLUListElement;
  const consoleElement = document.getElementById("console") as HTMLOutputElement;

  const initialMarkdown = (await getActiveFrame(db, url.searchParams.get("frame")!))?.content;
  editor.setContentHtml(markdownToHtml(initialMarkdown ?? "- New"));

  const getRecentFrameSuggestions = async () =>
    (await getRecentFrames(db, 10)).map((item) => `<a href="?${new URLSearchParams({ frame: item.id })}">${item.id}</a>`);
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
