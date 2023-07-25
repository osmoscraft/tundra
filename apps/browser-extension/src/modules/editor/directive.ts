import type { Command, EditorView } from "@codemirror/view";
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
  omnibox: OmniboxElement;
  omnimenu: OmnimenuElement;
  view: EditorView;
  library: CommandLibrary;
}

export function runDirective(context: RunDirectiveContext, directive: Directive) {
  const { omnibox, omnimenu, view, library } = context;

  const { operator, operand } = directive;
  switch (operator) {
    case Operator.InsertLink:
      console.log("insertLink", operand);
      break;
    case "insertLinkWithText":
      console.log("insertLinkWithText", operand);
      break;
    case "open":
      window.open(`/notebook.html?path=${encodeURIComponent(operand)}`, "_self");
      break;
    case "openInNew":
      window.open(`/notebook.html?path=${encodeURIComponent(operand)}`, "_blank");
      break;
    case "command":
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
