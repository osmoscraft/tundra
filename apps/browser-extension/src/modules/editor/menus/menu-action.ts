import type { Command, EditorView } from "@codemirror/view";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../../workers/data-worker";
import { stateToParams, type RouteState } from "../../router/route-state";
import { RouterElement } from "../../router/router-element";
import type { CommandLibrary } from "../commands";
import { getSelectedText } from "../reducers";
import type { OmniboxElement } from "./omnibox-element";

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
}

export async function handleMenuAction(context: OmnimenuActionContext, action: MenuAction) {
  const { proxy, omnibox, view, library, router } = context;
  const { state, mode } = action;

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
    const tx = view.state.replaceSelection(`[${linkTitle}](${state.linkToId!})`);
    view.dispatch(tx);

    if (isNewNote) {
      window.open(`?${stateToParams(state)}`, "_blank");
    }
  } else if (state.id) {
    if (mode === MenuActionMode.secondary) {
      window.open(`?${stateToParams(state)}`, "_blank");
    } else {
      router.push(`?${stateToParams(state)}`);
    }
  } else if (state.command) {
    const [namespace, commandName] = state.command!.split(".");
    const command = library[namespace]?.[commandName] as Command | undefined;

    command?.(view);
  } else {
    console.error("Unknown directive", state);
  }
}
