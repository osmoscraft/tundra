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
  chord?: string;
  // when?: string;
}

export function getEditorKeyBindings(bindings: CommandKeyBinding[], library: CommandLibrary): KeyBinding[] {
  const keyBindings: KeyBinding[] = [];

  bindings.forEach((binding) => {
    const [namespace, commandName] = binding.run.split(".");
    const command = library[namespace]?.[commandName] as Command | undefined;
    if (command && binding.key) {
      keyBindings.push({
        key: binding.key,
        preventDefault: true,
        run: command,
      });
    }
  });

  return keyBindings;
}

export interface CommandLibrary {
  [key: string]: CommandMap;
}

export interface CommandMap {
  [key: string]: Command;
}

export function editorCommand(): CommandLibrary {
  return {
    editor: {
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
    },
  };
}

export interface ExtendedCommandsConfig {
  dialog: HTMLDialogElement;
  omnibox: OmniboxElement;
  onGraphChanged: () => void;
  proxy: AsyncProxy<DataWorkerRoutes>;
  tabset: Tabset<TabMessage>;
}

export function extendedCommands({
  dialog,
  omnibox,
  onGraphChanged,
  proxy,
  tabset,
}: ExtendedCommandsConfig): CommandLibrary {
  return {
    shell: {
      addLink: (view) => {
        const selectedText = getSelectedText(view);
        omnibox.setValue(`:${selectedText}`);
        dialog.showModal();
        return true;
      },
      openOptions: () => {
        location.assign("./options.html");
        return true;
      },
      startSearch: (view) => {
        const selectedText = getSelectedText(view);
        omnibox.setValue(selectedText);
        dialog.showModal();
        return true;
      },
      startCommand: () => {
        omnibox.setValue(`>`);
        dialog.showModal();
        return true;
      },
    },
    file: {
      new: () => {
        location.assign(`?${stateToParams({ id: timestampToId(new Date()) })}`);
        return true;
      },
      delete: () => {
        deleteCurrentNote(proxy).then(onGraphChanged);
        return true;
      },
      save: (view) => {
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
    },
    repo: {
      pull: () => {
        const connection = getGithubConnection();
        if (connection) proxy.fetch(connection).then(proxy.merge).then(onGraphChanged);
        return true;
      },
      fetch: () => {
        const connection = getGithubConnection();
        if (connection) proxy.fetch(connection).then(onGraphChanged);
        return true;
      },
      merge: () => {
        proxy.merge().then(onGraphChanged);
        return true;
      },
      push: () => {
        const connection = getGithubConnection();
        if (connection) {
          proxy.push(connection).then(onGraphChanged);
        }
        return true;
      },
      resolve: () => {
        proxy.resolve().then(onGraphChanged);
        return true;
      },
      sync: () => {
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
      saveAndSync: (view) => {
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
    },
  };
}
