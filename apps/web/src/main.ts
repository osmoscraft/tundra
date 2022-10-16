import { Command, executeCommand, filterCommands, renderCommandSuggestions } from "./features/command/command";
import { openDB, runOnStore, tx } from "./features/db/db";
import { migrateTov1 } from "./features/db/migrations";
import { getShortcutCommand, KeyboardShortcut, matchShortcutEvent } from "./features/keyboard/shortcuts";
import { dispatchMessageOn, messageThunk } from "./features/message/message";
import { getInternalHrefFromClick, onPopState, pushUrl, routeSubject, selectInternalHrefClick, startRouter } from "./features/router/router";
import "./main.css";
import { hideDialog, showDialog } from "./utils/dom/dialog";
import { closestTarget, preventDefault } from "./utils/dom/event";
import { formData, getFormField, getInputValue, reset } from "./utils/dom/form";
import { $ } from "./utils/dom/query";
import { pipe, shortPipe } from "./utils/functional/pipe";
import { tap } from "./utils/functional/tap";
import { first } from "./utils/object/accessor";

async function main() {
  // Global commands
  const registeredCommands: Command[] = [
    { syntax: "config", description: "Open config dialog", action: messageThunk("config.openConfigDialog") },
    { syntax: "command show", description: "Show command palette", action: messageThunk("command.showPalette") },
    { syntax: "command hide", description: "Hide command palette", action: messageThunk("command.hidePalette") },
    { syntax: "sync", description: "Sync files", action: messageThunk("file.requestSync") },
  ];
  const filterRegisteredCommands = filterCommands(registeredCommands);

  // Global messages
  const dispatchMessage = dispatchMessageOn(window);
  window.addEventListener("system.message", (e) => {
    console.log(e);
    switch ((e as CustomEvent).detail.type) {
      case "command.showPalette":
        return activateCommandPalette();
      case "command.hidePalette":
        return deactivateCommandPalette();
      case "config.openConfigDialog":
        return console.log("open config dialog");
      case "file.requestSync":
        return console.log("request sync");
    }
  });

  // Global shortcut
  const globalShortcuts: KeyboardShortcut[] = [
    ["Ctrl-K", "", "command show"],
    ["Escape", "isCommandPaletteOpen", "command hide"],
  ];
  const matchGlobalShortcut = matchShortcutEvent(globalShortcuts);
  const getGlobalShortcutCommand = getShortcutCommand(globalShortcuts);
  window.addEventListener(
    "keydown",
    shortPipe(matchGlobalShortcut, preventDefault, getGlobalShortcutCommand, filterRegisteredCommands, first, executeCommand, dispatchMessage)
  );

  const db = await openDB("tinykb-db", 1, migrateTov1);

  // Command palette
  const commandDialog = $<HTMLDialogElement>("#command-dialog")!;
  const commandForm = $<HTMLFormElement>("#command-form")!;
  const commandInput = $<HTMLInputElement>("#command-input")!;
  const commandSuggestionList = $<HTMLUListElement>("#command-suggestion-list")!;

  const renderSuggestions = renderCommandSuggestions(commandSuggestionList);

  commandForm.addEventListener(
    "submit",
    pipe(
      preventDefault,
      closestTarget("form"),
      tap(shortPipe(formData, getFormField("command"), filterRegisteredCommands, first, executeCommand, dispatchMessage)),
      reset,
      hideDialog(commandDialog)
    )
  );

  commandInput.addEventListener("input", pipe(closestTarget("input"), getInputValue, filterRegisteredCommands, renderSuggestions));
  const activateCommandPalette = pipe(showDialog(commandDialog), commandInput.focus.bind(commandInput, undefined));
  const deactivateCommandPalette = hideDialog(commandDialog);

  // Config
  const configDialog = $<HTMLDialogElement>("#config-dialog")!;
  const configForm = $<HTMLFormElement>("#config-form")!;
  configForm.addEventListener("submit", pipe(preventDefault, closestTarget("form"), tap(pipe(formData, console.log))));

  // Router
  window.addEventListener("click", shortPipe(selectInternalHrefClick, preventDefault, getInternalHrefFromClick, pushUrl));
  window.addEventListener("popstate", onPopState);
  routeSubject.addEventListener("afterRouteChange", handleRouteChange.bind(null, db));
  startRouter();
}

// TBD
async function handleRouteChange(db: IDBDatabase) {
  const id = new URLSearchParams(window.location.search).get("id");
  console.log("debug", id);
  const frames = await tx(db, "frame", "readonly", (tx) => runOnStore(tx, "frame", (store) => store.getAll()));
  console.log(frames);
}

main();
