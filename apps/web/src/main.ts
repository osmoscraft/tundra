import { emit, on, preventDefault, shortPipe, tap } from "utils";
import "./main.css";
import { MenuElement } from "./modules/menu/menu";
import { getKeygram } from "./utils/dom/keyboard";

(async function main() {
  customElements.define("menu-element", MenuElement);

  const shortcuts: [string, (e: KeyboardEvent) => any][] = [
    ["ctrl+k", shortPipe(preventDefault, () => emit("menu.open"))],
    ["ctrl+`", shortPipe(preventDefault, tap(console.log))],
  ];
  const matchAndRun = (e: KeyboardEvent) => {
    const actual = getKeygram(e);
    shortcuts.forEach(([expected, handler]) => actual === expected && handler(e));
    return e;
  };

  on("keydown", matchAndRun);
})();
