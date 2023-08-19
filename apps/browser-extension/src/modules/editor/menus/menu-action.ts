import type { Command, EditorView } from "@codemirror/view";
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
  omnibox: OmniboxElement;
  view: EditorView;
  library: CommandLibrary;
  router: RouterElement;
}

export function handleMenuAction(context: OmnimenuActionContext, action: MenuAction) {
  const { omnibox, view, library, router } = context;
  const { state, mode } = action;

  switch (true) {
    case !!state.linkToId:
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
      break;
    case !!state.linkToUrl:
      // TBD
      break;
    case !!state.id:
      if (mode === MenuActionMode.secondary) {
        window.open(`?${stateToParams(state)}`, "_blank");
      } else {
        router.push(`?${stateToParams(state)}`);
      }

      break;
    case !!state.command:
      const [namespace, commandName] = state.command!.split(".");
      const command = library[namespace]?.[commandName] as Command | undefined;

      command?.(view);
      break;
    default:
      console.error("Unknown directive", state);
  }
}
