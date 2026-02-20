import type { Command, EditorView } from "@codemirror/view";
import type { AsyncProxy } from "@tundra/rpc-utils";
import type { DataWorkerRoutes } from "../../../workers/data-worker";
import { stateToParams, type RouteState } from "../../router/route-state";
import { RouterElement } from "../../router/router-element";
import type { CommandLibrary } from "../commands";
import { getSelectedText } from "../reducers";
import type { Tabset } from "../tabs/create-tabset";
import type { TabMessage } from "../tabs/tab-message";
import type { OmniboxElement } from "./omnibox-element";

export const RENAME_PREFIX = ">rename ";

export interface MenuAction {
  state: RouteState;
  mode: MenuActionMode;
}

export enum MenuActionMode {
  None = 0,
  /**
   * tasks: open in current tab, insert link with current text
   * key: Enter
   */
  primary = 1,
  /**
   * tasks: open in new tab, insert link and override text
   * key: Ctrl + Enter
   */
  secondary = 2,
  /**
   * tasks: insert link and override with search text
   * key: Ctrl + Shift + Enter
   */
  tertiary = 3,
}

export function getMenuActionMode(event: KeyboardEvent | MouseEvent) {
  if (event.ctrlKey) {
    if (event.shiftKey) {
      return MenuActionMode.tertiary;
    } else {
      return MenuActionMode.secondary;
    }
  } else {
    return MenuActionMode.primary;
  }
}

export interface OmnimenuActionContext {
  proxy: AsyncProxy<DataWorkerRoutes>;
  omnibox: OmniboxElement;
  view: EditorView;
  library: CommandLibrary;
  router: RouterElement;
  tabset: Tabset<TabMessage>;
}

/**
 * @returns `true` to keep the menu open, `false` to close it
 */
export async function handleMenuAction(context: OmnimenuActionContext, action: MenuAction): Promise<boolean> {
  const { proxy, omnibox, view, library, router, tabset } = context;
  const { state, mode } = action;

  if (state.command === "rename") {
    const currentId = new URLSearchParams(location.search).get("id");
    const input = omnibox.getValue();
    const newFilename = input.startsWith(RENAME_PREFIX) ? input.slice(RENAME_PREFIX.length).trim() : "";

    // If input already contains ">rename <filename>", execute the rename
    if (newFilename.length > 0) {
      const newId = newFilename.replace(/\.md$/, "");

      if (currentId && newId && newId !== currentId) {
        const content = view.state.doc.toString();
        await proxy.renameNote(currentId, newId, content);
        router.push(`?id=${encodeURIComponent(newId)}`);
      }
      return false; // close dialog
    } else {
      // Otherwise, autocomplete the input to ">rename [current-filename].md"
      if (currentId) {
        omnibox.setValue(`${RENAME_PREFIX}${currentId}.md`);
      }
      return true; // keep dialog open
    }
  }

  if (state.linkToId) {
    const isNewNote = !(await proxy.getNote(state.linkToId));
    const selectedText = getSelectedText(view);
    const primaryTitle = selectedText.length ? selectedText : state.title;

    const linkTitle =
      mode === MenuActionMode.secondary
        ? state.title
        : mode === MenuActionMode.tertiary
          ? omnibox.getValue().slice(1).trim() // remove ":" prefix
          : primaryTitle;

    view.dispatch(view.state.replaceSelection(`[${linkTitle!}](${state.linkToId})`));
    const titleEnd = view.state.selection.main.anchor - state.linkToId!.length - 3;
    const titleStart = titleEnd - linkTitle!.length;

    // select the title portion
    view.dispatch({
      selection: {
        anchor: titleStart,
        head: titleEnd,
      },
    });

    if (isNewNote) {
      // open draft in new tab while watching for any rename
      window.open(`?${stateToParams(state)}`, "_blank");

      tabset.until((message) => {
        if (getSelectedText(view) !== linkTitle) return true; // stop handling if user changed selection
        if (view.state.selection.main.anchor !== titleStart) return true; // stop handling if user moved selection start
        if (view.state.selection.main.head !== titleEnd) return true; // stop handling if user moved selection end

        const isMatchingNoteCreated = message.noteCreated?.id === state.linkToId;
        if (!isMatchingNoteCreated) return false; // continue handling if note is not saved
        if (!message.noteCreated?.title) return false; // continue handling if note has no valid title

        // replace title with valid saved title
        view.dispatch(view.state.replaceSelection(message.noteCreated!.title));

        // select replaced title
        view.dispatch({
          selection: {
            anchor: view.state.selection.main.anchor - message.noteCreated!.title!.length,
            head: view.state.selection.main.anchor,
          },
        });

        return true;
      });
    }
  } else if (state.id) {
    if (mode === MenuActionMode.secondary) {
      window.open(`?${stateToParams(state)}`, "_blank");
    } else {
      router.push(`?${stateToParams(state)}`);
    }
  } else if (state.command) {
    const command = library[state.command] as Command | undefined;

    command?.(view);
  } else {
    console.error("Unknown directive", state);
  }
  return false;
}
