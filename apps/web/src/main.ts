import { Command, dispatchCommand, filterCommands, renderCommandSuggestions } from "./features/command/command";
import { openDB, runOnStore, tx } from "./features/db/db";
import { migrateTov1 } from "./features/db/migrations";
import { handleKeydownWithShortcut, Shortcut } from "./features/keyboard/shortcuts";
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
  const db = await openDB("tinykb-db", 1, migrateTov1);

  const registeredCommands: Command[] = [
    { name: "Open config", syntax: "config", message: "config.openConfigDialog" },
    { name: "Sync changes", syntax: "sync", message: "sync.requestSync" },
  ];

  // TODO refactor command and keyboard shortcut to share the same messaging system
  // TODO refactor commandDialog and global shortcut to share the same handler with different contexts

  // Command palette
  const commandDialog = $<HTMLDialogElement>("#command-dialog")!;
  const commandForm = $<HTMLFormElement>("#command-form")!;
  const commandInput = $<HTMLInputElement>("#command-input")!;
  const commandSuggestionList = $<HTMLUListElement>("#command-suggestion-list")!;
  const commandDialogShortcuts: Shortcut[] = [["Escape", "", hideDialog(commandDialog)]];

  const renderSuggestions = renderCommandSuggestions(commandSuggestionList);
  const filterRegisteredCommands = filterCommands(registeredCommands);
  const handleCommandDialogShortcuts = handleKeydownWithShortcut(commandDialogShortcuts);

  commandForm.addEventListener(
    "submit",
    pipe(
      preventDefault,
      closestTarget("form"),
      tap(shortPipe(formData, getFormField("command"), filterRegisteredCommands, first, dispatchCommand(window))),
      reset,
      hideDialog(commandDialog)
    )
  );
  commandDialog.addEventListener("keydown", handleCommandDialogShortcuts);
  commandInput.addEventListener("input", pipe(closestTarget("input"), getInputValue, filterRegisteredCommands, renderSuggestions));
  const activateCommandPalette = pipe(showDialog(commandDialog), commandInput.focus.bind(commandInput, undefined));

  // Config
  const configDialog = $<HTMLDialogElement>("#config-dialog")!;
  const configForm = $<HTMLFormElement>("#config-form")!;
  configForm.addEventListener("submit", pipe(preventDefault, closestTarget("form"), tap(pipe(formData, console.log))));

  // Router
  window.addEventListener("click", shortPipe(selectInternalHrefClick, preventDefault, getInternalHrefFromClick, pushUrl));
  window.addEventListener("popstate", onPopState);
  routeSubject.addEventListener("afterRouteChange", handleRouteChange.bind(null, db));
  startRouter();

  // Global shortcut
  const globalShortcuts: Shortcut[] = [["Ctrl-K", "", pipe(preventDefault, activateCommandPalette)]];
  window.addEventListener("keydown", pipe(handleKeydownWithShortcut.bind(null, globalShortcuts)));

  // Global command handling
  // TODO refactor to shared global messaging system
  window.addEventListener("ui-message", (e) => {
    switch ((e as CustomEvent).detail.type) {
      case "config.openConfigDialog":
        return console.log("open config dialog");
      case "sync.requestSync":
        return console.log("request sync");
    }
  });
}

// TBD
async function handleRouteChange(db: IDBDatabase) {
  const id = new URLSearchParams(window.location.search).get("id");
  console.log("debug", id);
  const frames = await tx(db, "frame", "readonly", (tx) => runOnStore(tx, "frame", (store) => store.getAll()));
  console.log(frames);
}

main();
