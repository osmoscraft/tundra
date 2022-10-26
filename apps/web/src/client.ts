import { emit, on, preventDefault, ProxyClient, shortPipe } from "utils";
import { ActionBarElement } from "./client/action-bar";
import { Command, handleCommandMatch, runCommand } from "./client/command";
import { ConfigElement } from "./client/config";
import { handleDBRequest } from "./client/db";
import { logInfo } from "./client/log";
import { runShortcut, Shortcut } from "./client/shortcut";
import { StatusBarElement } from "./client/status-bar";
import { testConnection } from "./client/sync";
import type { AppRoutes } from "./routes";

(async function main() {
  customElements.define("action-bar-element", ActionBarElement);
  customElements.define("status-bar-element", StatusBarElement);
  customElements.define("config-element", ConfigElement);

  logInfo(`isProd: ${import.meta.env.PROD}`);
  const workerPromise = import.meta.env.PROD ? import("./server?sharedworker") : import("./server?worker");
  workerPromise.then((imported) => {
    const worker = new imported.default();
    const proxy = new ProxyClient<AppRoutes>(worker);
    proxy.start();
    proxy.request("echo", { message: "hello from client" }).then((res) => console.log(`echo response`, res.message));
  });

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
  on("db.request-tx", handleDBRequest);
  on("keydown", runShortcut.bind(null, shortcuts));
  on("sync.test-remote", (e) => testConnection(e.detail));
})();
