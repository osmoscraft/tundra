import { curry } from "../../utils/functional/curry";

export interface Command {
  name: string;
  syntax: string;
  message: string;
}

export const matchCommand = (input: string, command: Command) =>
  [command.name, command.syntax].some((commandPart) => commandPart.toLocaleLowerCase().startsWith(input.toLocaleLowerCase()));

export const filterCommands = curry((commands: Command[], input: string) => commands.filter(matchCommand.bind(null, input)));

export const renderCommandSuggestions = curry(
  (container: HTMLUListElement, commands: Command[]) => (container.innerHTML = commands.map((command) => `<li>${command.syntax} ${command.name}</li>`).join(""))
);

export const dispatchCommand = curry((target: EventTarget, command: Command) => {
  command && target.dispatchEvent(new CustomEvent("ui-message", { detail: { type: command.message } }));
  return command;
});
