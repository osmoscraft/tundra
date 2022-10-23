import { emit, on, preventDefault, shortPipe } from "utils";
import "./main.css";
import { Command, runCommand } from "./modules/command/command";
import { MenuElement } from "./modules/menu/menu";
import { runShortcut, Shortcut } from "./modules/shortcut/shortcut";
import { StatusBarElement } from "./modules/status-bar/status-bar";

(async function main() {
  customElements.define("menu-element", MenuElement);
  customElements.define("status-bar-element", StatusBarElement);

  const shortcuts: Shortcut[] = [
    ["ctrl+k", shortPipe(preventDefault, () => emit("menu.open"))],
    ["ctrl+`", shortPipe(preventDefault, () => emit("bar.toggle"))],
    ["ctrl+l", shortPipe(preventDefault, () => emit("bar.clear"))],
  ];
  const commands: Command[] = [["config", () => emit("config.open")]];

  on("command.exec", runCommand.bind(null, commands));
  on("keydown", runShortcut.bind(null, shortcuts));

  // TODO implement
  on("config.open", console.log);
})();
