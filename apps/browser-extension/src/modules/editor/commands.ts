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
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { OmniboxElement } from "./menus/omnibox-element";

import { stateToParams } from "../router/route-state";
import { timestampToId } from "../sync/path";
import { deleteCurrentNote } from "./delete";
import { getSelectedText } from "./reducers";
import { saveCurrentNote } from "./save";

export interface CommandKeyBinding {
  name: string;
  run: string;
  key?: string;
  chord?: string;
  // when?: string;
}

export function getEditorBindings(bindings: CommandKeyBinding[], library: CommandLibrary): KeyBinding[] {
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

export function editorCommands(): CommandLibrary {
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
    },
  };
}

export interface ExtendedCommandsConfig {
  proxy: AsyncProxy<DataWorkerRoutes>;
  dialog: HTMLDialogElement;
  omnibox: OmniboxElement;
  onFilesChanged: () => void;
}

export function extendedCommands({ proxy, dialog, omnibox, onFilesChanged }: ExtendedCommandsConfig): CommandLibrary {
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
        deleteCurrentNote(proxy).then(onFilesChanged);
        return true;
      },
      save: (view) => {
        saveCurrentNote(() => view.state.doc.toString(), proxy).then(onFilesChanged);
        return true;
      },
    },
    repo: {
      pull: () => {
        proxy.fetch().then(proxy.merge).then(onFilesChanged);
        return true;
      },
      fetch: () => {
        proxy.fetch().then(onFilesChanged);
        return true;
      },
      merge: () => {
        proxy.merge().then(onFilesChanged);
        return true;
      },
      push: () => {
        proxy.push().then(onFilesChanged);
        return true;
      },
      resolve: () => {
        proxy.resolve().then(onFilesChanged);
        return true;
      },
      sync: () => {
        proxy.fetch().then(proxy.merge).then(proxy.push).then(onFilesChanged);
        return true;
      },
    },
  };
}
