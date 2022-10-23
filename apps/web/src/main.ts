import { emit, on, preventDefault, shortPipe } from "utils";
import { ActionBarElement } from "./modules/action-bar";
import { Command, runCommand } from "./modules/command";
import { MenuElement } from "./modules/menu";
import { runShortcut, Shortcut } from "./modules/shortcut";
import { StatusBarElement } from "./modules/status-bar";

(async function main() {
  customElements.define("action-bar-element", ActionBarElement);
  customElements.define("menu-element", MenuElement);
  customElements.define("status-bar-element", StatusBarElement);

  const shortcuts: Shortcut[] = [
    ["ctrl+k", shortPipe(preventDefault, () => emit("action-bar.focus"))],
    ["ctrl+`", shortPipe(preventDefault, () => emit("status-bar.toggle"))],
    ["ctrl+l", shortPipe(preventDefault, () => emit("status-bar.clear"))],
  ];
  const commands: Command[] = [["config", () => emit("config.open")]];

  on("command.exec", runCommand.bind(null, commands));
  on("keydown", runShortcut.bind(null, shortcuts));

  // TODO implement
  on("config.open", console.log);
})();
