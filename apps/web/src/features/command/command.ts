import { curry } from "../../utils/functional/curry";
import type { Message } from "../message/message";

export interface Command {
  syntax: string;
  description: string;
  action: (args: string[]) => Message;
}

export const matchCommand = (input: string, command: Command) =>
  [command.description, command.syntax].some((commandPart) => commandPart.toLocaleLowerCase().startsWith(input.toLocaleLowerCase()));

export const filterCommands = curry((commands: Command[], input: string) => commands.filter(matchCommand.bind(null, input)));

export const renderCommandSuggestions = curry(
  (container: HTMLUListElement, commands: Command[]) =>
    (container.innerHTML = commands.map((command) => `<li>${command.syntax} - ${command.description}</li>`).join(""))
);

export const executeCommand = (command: Command) => {
  const message = command.action([]); // TBD
  return message;
};
