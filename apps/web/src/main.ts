import { emit, on, preventDefault, shortPipe } from "utils";
import { ActionBarElement } from "./modules/action-bar";
import { Command, handleCommandMatch, runCommand } from "./modules/command";
import { ConfigElement } from "./modules/config";
import { runShortcut, Shortcut } from "./modules/shortcut";
import { StatusBarElement } from "./modules/status-bar";

(async function main() {
  customElements.define("action-bar-element", ActionBarElement);
  customElements.define("status-bar-element", StatusBarElement);
  customElements.define("config-element", ConfigElement);

  const shortcuts: Shortcut[] = [
    ["ctrl+k", shortPipe(preventDefault, () => emit("action-bar.enter"))],
    ["ctrl+`", shortPipe(preventDefault, () => emit("status-bar.toggle"))],
    ["ctrl+l", shortPipe(preventDefault, () => emit("status-bar.clear"))],
  ];
  const commands: Command[] = [
    ["config", () => emit("config.open-ui")],
    ["sync", () => {}],
    ["link", () => {}],
    ["open", () => {}],
  ];

  on("command.exec", runCommand.bind(null, commands));
  on("command.request-match", handleCommandMatch.bind(null, commands));
  on("keydown", runShortcut.bind(null, shortcuts));
})();
