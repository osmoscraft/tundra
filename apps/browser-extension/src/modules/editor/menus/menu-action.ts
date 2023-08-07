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
  primary = 1,
  secondary = 2,
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
  dialog: HTMLDialogElement;
  omnibox: OmniboxElement;
  view: EditorView;
  library: CommandLibrary;
  router: RouterElement;
}

export function handleMenuAction(context: OmnimenuActionContext, action: MenuAction) {
  const { dialog, omnibox, view, library, router } = context;
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
      dialog.close();
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

      dialog.close();
      command?.(view);
      break;
    default:
      console.error("Unknown directive", state);
  }
}
