import { emit, on } from "utils";
import "./main.css";
import { BarElement } from "./modules/bar/bar";
import { getKeygram } from "./modules/kbd/kbd";
import { logInfo } from "./modules/log/log";

customElements.define("bar-element", BarElement);

(async function main() {
  logInfo("App started");

  on("keydown", (e) => {
    const gram = getKeygram(e);
    switch (gram) {
      case "ctrl+`":
        e.preventDefault();
        emit("bar.toggle");
        break;
    }
  });
})();
