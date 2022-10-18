import "./main.css";
import { HUDElement } from "./modules/hud/hud-element";
import { logDebug, logError, logInfo } from "./modules/log";

customElements.define("hud-element", HUDElement);

export async function main() {
  logError("Testing error logging");
  logInfo("Testing info logging");
  logDebug("Test deubg logging");
}

main();
