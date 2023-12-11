import {
  copyLineDown,
  copyLineUp,
  indentLess,
  indentMore,
  moveLineDown,
  moveLineUp,
  redo,
  undo,
} from "@codemirror/commands";
import type { Command, KeyBinding } from "@codemirror/view";
import type { AsyncProxy } from "@tundra/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { OmniboxElement } from "./menus/omnibox-element";

import { closeSearchPanel, openSearchPanel } from "@codemirror/search";
import { stateToParams } from "../router/route-state";
import { getGithubConnection } from "../sync/github/github-config";
import { timestampToId } from "../sync/path";
import {
  moveCursorBlockEnd,
  moveCursorBlockStart,
  selectCursorBlockEnd,
  selectCursorBlockStart,
} from "./code-mirror-ext/block";
import { deleteCurrentNote } from "./delete";
import { getSelectedText } from "./reducers";
import { saveCurrentNote } from "./save";
import type { Tabset } from "./tabs/create-tabset";
import type { TabMessage } from "./tabs/tab-message";

export interface CommandKeyBinding {
  name: string;
  run: string;
  key?: string;
  /** @default editor */
  scope?: string;
}

export function getEditorKeyBindings(bindings: CommandKeyBinding[], library: CommandLibrary): KeyBinding[] {
  const keyBindings: KeyBinding[] = [];

  bindings.forEach((binding) => {
    const commandName = binding.run;
    const command = library[commandName] as Command | undefined;
    if (command && binding.key) {
      keyBindings.push({
        key: binding.key,
        preventDefault: true,
        run: command,
        scope: binding.scope ?? "editor",
      });
    }
  });

  return keyBindings;
}

export interface CommandLibrary {
  [key: string]: Command;
}

export function editorCommand(): CommandLibrary {
  return {
    moveLineUp,
    moveLineDown,
    copyLineUp,
    copyLineDown,
    indentLess,
    indentMore,
    undo,
    redo,
    moveCursorBlockStart,
    moveCursorBlockEnd,
    selectCursorBlockStart,
    selectCursorBlockEnd,
    openSearchPanel,
    closeSearchPanel,
  };
}

export interface ExtendedCommandsConfig {
  dialog: HTMLDialogElement;
  omnibox: OmniboxElement;
  onGraphChanged: () => void;
  proxy: AsyncProxy<DataWorkerRoutes>;
  statusEvents: EventTarget;
  tabset: Tabset<TabMessage>;
}

export function extendedCommands({
  dialog,
  omnibox,
  onGraphChanged,
  proxy,
  statusEvents,
  tabset,
}: ExtendedCommandsConfig): CommandLibrary {
  return {
    openOmniboxLinkMode: (view) => {
      const selectedText = getSelectedText(view);
      omnibox.setValue(`:${selectedText}`);
      dialog.showModal();
      return true;
    },
    openOptions: () => {
      location.assign("./options.html");
      return true;
    },
    openOmniboxSearchMode: (view) => {
      const selectedText = getSelectedText(view);
      omnibox.setValue(selectedText);
      dialog.showModal();
      return true;
    },
    openOmniboxCommandMode: () => {
      omnibox.setValue(`>`);
      dialog.showModal();
      return true;
    },
    newFile: () => {
      location.assign(`?${stateToParams({ id: timestampToId(new Date()) })}`);
      return true;
    },
    deleteFile: () => {
      deleteCurrentNote(proxy).then(onGraphChanged);
      return true;
    },
    saveFile: (view) => {
      saveCurrentNote({
        getContent: () => view.state.doc.toString(),
        onCreated: (note) =>
          tabset.broadcast({
            noteCreated: {
              id: note.id,
              title: note.title,
            },
          }),
        proxy,
      }).then(onGraphChanged);
      return true;
    },
    pullChanges: () => {
      const connection = getGithubConnection();
      if (connection) proxy.fetch(connection).then(proxy.merge).then(onGraphChanged);
      return true;
    },
    fetchChanges: () => {
      const connection = getGithubConnection();
      if (connection) proxy.fetch(connection).then(onGraphChanged);
      return true;
    },
    mergeChanges: () => {
      proxy.merge().then(onGraphChanged);
      return true;
    },
    pushChanges: () => {
      const connection = getGithubConnection();
      if (connection) {
        proxy.push(connection).then(onGraphChanged);
      }
      return true;
    },
    resolveConflicts: () => {
      proxy.resolve().then(onGraphChanged);
      return true;
    },
    syncChanges: () => {
      const connection = getGithubConnection();
      if (connection) {
        proxy
          .fetch(connection)
          .then(proxy.merge)
          .then(() => proxy.push(connection))
          .then(onGraphChanged);
      }
      return true;
    },
    saveFilesAndSyncChanges: (view) => {
      saveCurrentNote({
        getContent: () => view.state.doc.toString(),
        onCreated: (note) =>
          tabset.broadcast({
            noteCreated: {
              id: note.id,
              title: note.title,
            },
          }),
        proxy,
      })
        .then(onGraphChanged)
        .then(() => {
          const connection = getGithubConnection();
          if (connection) {
            proxy
              .fetch(connection)
              .then(proxy.merge)
              .then(() => proxy.push(connection))
              .then(onGraphChanged);
          }
        });

      return true;
    },
    toggleSpellcheck: (view) => {
      const spellcheckElement = view.dom?.querySelector("[spellcheck]");
      if (spellcheckElement) {
        const newValue = spellcheckElement?.getAttribute("spellcheck") === "true" ? "false" : "true";
        spellcheckElement.setAttribute("spellcheck", newValue);
        statusEvents.dispatchEvent(new CustomEvent("status", { detail: `Spellcheck: ${newValue}` }));
      }

      return true;
    },
  };
}
