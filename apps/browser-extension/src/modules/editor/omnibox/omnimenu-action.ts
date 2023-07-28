import type { Command, EditorView } from "@codemirror/view";
import { stateToParams } from "../../router/route-state";
import { nodePathToId } from "../../sync/path";
import type { CommandLibrary } from "../commands";
import { getSelectedText } from "../reducers";
import type { OmniboxElement } from "./omnibox-element";
import type { OmnimenuAction, OmnimenuElement } from "./omnimenu-element";
import { SubmitMode } from "./submit-mode";

export interface OmnimenuActionContext {
  omnibox: OmniboxElement;
  omnimenu: OmnimenuElement;
  view: EditorView;
  library: CommandLibrary;
}

export function handleOmnimenuAction(context: OmnimenuActionContext, action: OmnimenuAction) {
  const { omnibox, omnimenu, view, library } = context;
  const { state, mode } = action;

  switch (true) {
    case !!state.linkTo:
      const linkTitle = mode === SubmitMode.secondary ? state.title : getSelectedText(view);
      const tx = view.state.replaceSelection(`[${linkTitle}](${nodePathToId(state.linkTo!)})`);
      view.dispatch(tx);
      omnibox.clear();
      omnimenu.clear();
      view.focus();
      break;
    case !!state.path:
      window.open(`?${stateToParams(state)}`, mode === SubmitMode.secondary ? "_blank" : "_self");
      break;
    case !!state.command:
      const [namespace, commandName] = state.command!.split(".");
      const command = library[namespace]?.[commandName] as Command | undefined;

      omnibox.clear();
      omnimenu.clear();
      view.focus();
      command?.(view);
      break;
    default:
      console.error("Unknown directive", state);
  }
}
