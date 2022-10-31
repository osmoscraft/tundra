import { emit, on, preventDefault, shortPipe } from "utils";
import { ActionBarElement } from "./client/action-bar";
import { Command, handleCommandMatch, runCommand } from "./client/command";
import { ConfigElement } from "./client/config";
import { logInfo } from "./client/log";
import { runShortcut, Shortcut } from "./client/shortcut";
import { StatusBarElement } from "./client/status-bar";
import { request } from "./client/worker";

(async function main() {
  customElements.define("action-bar-element", ActionBarElement);
  customElements.define("status-bar-element", StatusBarElement);
  customElements.define("config-element", ConfigElement);

  logInfo(`MODE: ${import.meta.env.MODE}`);

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
    ["clone", () => request("gitClone")],
  ];

  on("command.exec", runCommand.bind(null, commands));
  on("command.request-match", handleCommandMatch.bind(null, commands));
  on("keydown", runShortcut.bind(null, shortcuts));
})();
