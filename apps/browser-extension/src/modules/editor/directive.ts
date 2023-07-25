import type { Command, EditorView } from "@codemirror/view";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import { nodePathToId } from "../sync/path";
import type { CommandLibrary } from "./commands";
import type { OmniboxElement } from "./omnibox/omnibox-element";
import type { OmnimenuElement } from "./suggestion-list/omnimenu-element";

export enum Operator {
  Open = "open",
  OpenInNew = "openInNew",
  InsertLink = "insertLink",
  InsertLinkWithText = "insertLinkWithText",
  Command = "command",
}

export function stringifyDirective(directive: Directive): string {
  return `${directive.operator}:${directive.operand}`;
}

export function parseDirective(directiveString: string): Directive {
  const [operator, operand] = directiveString.split(":");
  return { operator: operator as Operator, operand };
}

export interface Directive {
  operator: Operator;
  operand: string;
}

export interface RunDirectiveContext {
  proxy: AsyncProxy<DataWorkerRoutes>;
  omnibox: OmniboxElement;
  omnimenu: OmnimenuElement;
  view: EditorView;
  library: CommandLibrary;
}

export function runDirective(context: RunDirectiveContext, directive: Directive) {
  const { omnibox, omnimenu, proxy, view, library } = context;

  const { operator, operand } = directive;
  switch (operator) {
    case Operator.InsertLink:
      proxy.getFile(operand).then((file) => {
        if (!file) return;

        const tx = view.state.replaceSelection(`[${file.meta.title}](${nodePathToId(file.path)})`);
        view.dispatch(tx);
        omnibox.clear();
        omnimenu.clear();
        view.focus();
      });
      break;
    case Operator.InsertLinkWithText:
      proxy.getFile(operand).then((file) => {
        if (!file) return;

        const selectedText = view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to);
        const tx = view.state.replaceSelection(`[${selectedText}](${nodePathToId(file.path)})`);
        view.dispatch(tx);
        omnibox.clear();
        omnimenu.clear();
        view.focus();
      });
      break;
    case Operator.Open:
      window.open(`/notebook.html?path=${encodeURIComponent(operand)}`, "_self");
      break;
    case Operator.OpenInNew:
      window.open(`/notebook.html?path=${encodeURIComponent(operand)}`, "_blank");
      break;
    case Operator.Command:
      const [namespace, commandName] = operand.split(".");
      const command = library[namespace]?.[commandName] as Command | undefined;

      omnibox.clear();
      omnimenu.clear();
      view.focus();
      command?.(view);
      break;
    default:
      console.error("Unknown directive", directive);
  }
}
