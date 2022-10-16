import { uiModalExitEvent } from "../modal/focus-trap-element";
import type { Command } from "./command";
import { commandRunEvent } from "./command-events";
import { systemCommands } from "./system-commands";

export class CommandPaletteElement extends HTMLElement {
  connectedCallback() {
    const form$ = this.querySelector("form")!;
    const input$ = this.querySelector("input")!;
    const suggestions$ = this.querySelector("ul")!;

    form$.addEventListener("submit", (e) => {
      e.preventDefault();
      const commandString = new FormData(form$).get("command") as string;
      const selectedCommand = systemCommands.filter(filterCommand.bind(null, commandString))[0];
      selectedCommand && commandRunEvent.emit(this, selectedCommand.syntax);
      form$.reset();
      uiModalExitEvent.emit(this);
    });

    input$.addEventListener("input", (e) => {
      const commandString = new FormData(form$).get("command") as string;
      suggestions$.innerHTML = systemCommands.filter(filterCommand.bind(null, commandString)).map(renderCommand).join("");
    });

    suggestions$.innerHTML = systemCommands.map(renderCommand).join("");
  }
}

function filterCommand(input: string, command: Command) {
  return [command.description, command.syntax].some((field) => field.includes(input));
}

function renderCommand(command: Command) {
  return `<li>${command.syntax} (${command.description})</li>`;
}
