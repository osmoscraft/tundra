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
import type { OmniboxElement } from "./omnibox/omnibox-element";

import { save } from "./save";

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

export function extendedCommands(proxy: AsyncProxy<DataWorkerRoutes>, omnibox: OmniboxElement): CommandLibrary {
  return {
    shell: {
      openSearch: () => {
        omnibox.open();
        return true;
      },
      openCommand: () => {
        omnibox.open(">");
        return true;
      },
    },
    file: {
      save: (view) => {
        save(() => view.state.doc.toString(), proxy);
        return true;
      },
      syncAll: () => {
        proxy.pull().then(() => proxy.push());
        return true;
      },
    },
  };
}
