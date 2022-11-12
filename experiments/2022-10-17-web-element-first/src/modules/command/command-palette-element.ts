import { uiModalExitEvent } from "../modal/focus-trap-element";
import type { Command } from "./command";
import { commandRunEvent } from "./command-events";

export class CommandPaletteElement extends HTMLElement {
  start(commands: Command[]) {
    const form$ = this.querySelector("form")!;
    const input$ = this.querySelector("input")!;
    const suggestions$ = this.querySelector("ul")!;

    form$.addEventListener("submit", (e) => {
      e.preventDefault();
      const commandString = new FormData(form$).get("command") as string;
      const selectedCommand = commands.filter(filterCommand(commandString))[0];
      selectedCommand && commandRunEvent.emit(this, selectedCommand.key);
      form$.reset();
      uiModalExitEvent.emit(this);
    });

    input$.addEventListener("input", () => {
      const commandString = new FormData(form$).get("command") as string;
      suggestions$.innerHTML = commands.filter(filterCommand(commandString)).map(renderCommand).join("");
    });

    suggestions$.innerHTML = commands.filter(filterCommand("")).map(renderCommand).join("");
  }
}

const filterCommand = (input: string) => (command: Command) => {
  return [command.description, command.key].some((field) => field.includes(input)) && !command.hidden;
};

function renderCommand(command: Command) {
  return `<li>${command.key} (${command.description})</li>`;
}
