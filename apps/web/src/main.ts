import "./main.css";
import { HUDElement } from "./modules/hud/hud-element";
import { getKeygram } from "./modules/keyboard";
import { logDebug, logError, logInfo } from "./modules/log";
import { emit, on } from "./utils/dom/event";

customElements.define("hud-element", HUDElement);

export async function main() {
  logError("Testing error logging");
  logInfo("Testing info logging");
  logDebug("Test deubg logging");

  on("keydown", (e) => {
    const gram = getKeygram(e);
    if (gram === "Ctrl+`") {
      emit("hud.toggle");
    }
  });
}

main();
