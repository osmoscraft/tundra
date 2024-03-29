import { createSuggester, flushTasks, getForm, tapOnCommand } from "./features/command/command";
import { handleClone, handleFetch, handlePull, handlePush, handleStatus, handleTestConnection } from "./features/command/tasks";
import "./features/console/console";
import { log } from "./features/console/console";
import "./features/console/console.css";
import { getAppDB } from "./features/db/db";
import { getActiveFrame, getRecentFrames, putDraftFrame } from "./features/db/queries";
import { htmlToMarkdown, markdownToHtml } from "./features/editor/codec";
import { addLink, getEditorHtml, indentRelative, moveDown, moveUp, setEditorHtml } from "./features/editor/editor";
import "./features/editor/editor.css";
import { popCursorState, pushCursorState } from "./utils/cursor";
import { preventDefault } from "./utils/events";
import { closestForm, formData, getFormField, resetForm } from "./utils/form";
import { getKeyCodeString } from "./utils/keyboard";
import { sleep } from "./utils/tick";
import { ensureUrlParam } from "./utils/url";

export default async function main() {
  const url = new URL(location.href);
  if (!ensureUrlParam(url, "frame", "new")) return;

  const cursorStack: Range[] = [];
  const pushCursor = pushCursorState.bind(null, cursorStack);
  const popCursor = popCursorState.bind(null, cursorStack);

  const db = await getAppDB();
  let existingFrame = await getActiveFrame(db, url.searchParams.get("frame")!);

  const editor = document.getElementById("editor") as HTMLElement;
  const commandDialog = document.getElementById("command-dialog") as HTMLDialogElement;
  const commandForm = document.getElementById("command-form") as HTMLFormElement;
  const commandSuggestions = document.getElementById("command-suggestions") as HTMLUListElement;
  const consoleElement = document.getElementById("console") as HTMLOutputElement;

  const commandTaskQueue: (() => any)[] = [];

  const initialMarkdown = existingFrame?.content ?? "- New";
  setEditorHtml(editor, markdownToHtml(initialMarkdown));

  const getRecentFrameSuggestions = async () =>
    (await getRecentFrames(db, 10)).map((item) => `<a href="?${new URLSearchParams({ frame: item.id })}">${item.id}</a>`);
  const logToConsole = log.bind(null, consoleElement);
  const handleCommandSubmit = (e: Event) => tapOnCommand(getForm(preventDefault(e)), logToConsole).reset();

  const suggest = createSuggester([
    async (command) => (command === "" ? ["o - <u>o</u>pen", "k - lin<u>k</u>", "save", "ls", "test", "fetch", "pull", "push", "sync"] : []),
    async (command) => (command.startsWith("o ") ? await getRecentFrameSuggestions() : []),
    async (command) => (command.length && "sandbox".startsWith(command) ? [`<a href="/sandbox.html">Open editor sandbox</a>`] : []),
  ]);

  const getCommand = (e: Event) => getFormField("command", formData(closestForm(e.target as Element)!)) as string;
  const handleCommandSuggest = async (command: string) => {
    // instant commands
    switch (command) {
      case "k":
        commandDialog.close();
        commandTaskQueue.push(() => {
          const href = prompt("href");
          if (!href) return;
          const text = prompt("text");
          if (!text) return;
          addLink(href, text);
        });
        break;
      case "ls":
        commandDialog.close();
        commandTaskQueue.push(() => handleStatus(logToConsole));
        break;
      case "save":
        commandDialog.close();
        commandTaskQueue.push(async () => {
          const id = existingFrame?.id ?? crypto.randomUUID();
          await putDraftFrame(db, {
            id,
            content: htmlToMarkdown(getEditorHtml(editor)),
            dateUpdated: new Date(),
          });

          // TODO update without reloading
          if (!existingFrame) {
            location.search = new URLSearchParams({ frame: id }).toString();
          }
        });
        break;
      case "clone":
        commandDialog.close();
        commandTaskQueue.push(() => handleClone(logToConsole));
        break;
      case "fetch":
        commandDialog.close();
        commandTaskQueue.push(() => handleFetch(logToConsole));
        break;
      case "pull":
        commandDialog.close();
        commandTaskQueue.push(() => handlePull(logToConsole));
        break;
      case "push":
        commandDialog.close();
        commandTaskQueue.push(() => handlePush(logToConsole));
        break;
      case "sync":
        commandDialog.close();
        commandTaskQueue.push(
          () => handlePull(logToConsole),
          () => handlePush(logToConsole)
        );
        break;
      case "test":
        commandDialog.close();
        commandTaskQueue.push(() => handleTestConnection(logToConsole));
        break;
    }

    // suggest commands
    commandSuggestions.innerHTML = (await suggest(command)).map((item) => `<li>${item}</li>`).join("");
  };

  const handleCommandAutoComplete = async (e: KeyboardEvent) => {
    if (e.isComposing) return;
    const command = getCommand(e);
    if (!command && e.key === "o") {
      (e.target as HTMLInputElement).value = "o ";
      e.preventDefault();
      handleCommandSuggest("o ");
    }
  };

  commandForm.addEventListener("submit", handleCommandSubmit);
  commandForm.addEventListener("keydown", (e) => handleCommandAutoComplete(e));
  commandForm.addEventListener("input", (e) => handleCommandSuggest(getCommand(e)));

  commandDialog.addEventListener("close", async () => {
    popCursor();
    await sleep();
    await flushTasks(commandTaskQueue);
  });

  window.addEventListener("keydown", (e) => {
    const keycode = getKeyCodeString(e);

    switch (keycode) {
      case "Alt-ArrowLeft":
        indentRelative(-1);
        e.preventDefault();
        break;
      case "Alt-ArrowRight":
        indentRelative(1);
        e.preventDefault();
        break;
      case "Alt-ArrowUp":
        moveUp();
        e.preventDefault();
        break;
      case "Alt-ArrowDown":
        moveDown();
        e.preventDefault();
        break;
      case "Ctrl-KeyK":
        pushCursor();
        resetForm(commandForm);
        handleCommandSuggest("");
        commandDialog.showModal();
        e.preventDefault();
        break;
    }
  });
}

main();
