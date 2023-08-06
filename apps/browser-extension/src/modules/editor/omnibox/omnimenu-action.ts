import type { Command, EditorView } from "@codemirror/view";
import { stateToParams } from "../../router/route-state";
import type { CommandLibrary } from "../commands";
import { getSelectedText } from "../reducers";
import type { OmniboxElement } from "./omnibox-element";
import type { OmnimenuAction, OmnimenuElement } from "./omnimenu-element";
import { SubmitMode } from "./submit-mode";

export interface OmnimenuActionContext {
  dialog: HTMLDialogElement;
  omnibox: OmniboxElement;
  omnimenu: OmnimenuElement;
  view: EditorView;
  library: CommandLibrary;
}

export function handleOmnimenuAction(context: OmnimenuActionContext, action: OmnimenuAction) {
  const { dialog, omnibox, omnimenu, view, library } = context;
  const { state, mode } = action;

  switch (true) {
    case !!state.linkToId:
      const selectedText = getSelectedText(view);
      const primaryTitle = selectedText.length ? selectedText : state.title;

      const linkTitle =
        mode === SubmitMode.secondary
          ? state.title
          : mode === SubmitMode.tertiary
          ? omnibox.getValue().slice(1).trim() // remove ":" prefix
          : primaryTitle;
      const tx = view.state.replaceSelection(`[${linkTitle}](${state.linkToId!})`);
      view.dispatch(tx);
      dialog.close();
      break;
    case !!state.id:
      window.open(`?${stateToParams(state)}`, mode === SubmitMode.secondary ? "_blank" : "_self");
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
