import "./main.css";
import { CommanderElement } from "./modules/commander/commander-element";
import { HUDElement } from "./modules/hud/hud-element";
import { getKeygram } from "./modules/keyboard";
import { logDebug, logError, logInfo } from "./modules/log";
import { emit, on } from "./utils/dom/event";

customElements.define("hud-element", HUDElement);
customElements.define("commander-element", CommanderElement);

export async function main() {
  logError("Testing error logging");
  logInfo("Testing info logging");
  logDebug("Test deubg logging");

  on("keydown", (e) => {
    const gram = getKeygram(e);
    switch (gram) {
      case "ctrl+`":
        e.preventDefault();
        emit("hud.toggle");
        break;
      case "ctrl+k":
        e.preventDefault();
        emit("commander.open");
        break;
    }
  });

  // commander.open should be translated into modal.open event with commander template specified
  // on("commander.open", () => emit("modal.open", {details: {template: commaderTemplate}}))
}

main();
