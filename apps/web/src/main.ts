import { on, preventDefault, shortPipe, tap } from "utils";
import "./main.css";
import { getKeygram } from "./modules/keyboard/keygram";
(async function main() {
  const shortcuts: [string, (e: KeyboardEvent) => any][] = [
    ["ctrl+k", shortPipe(preventDefault, tap(console.log))],
    ["ctrl+`", shortPipe(preventDefault, tap(console.log))],
  ];
  const matchAndRun = (e: KeyboardEvent) => {
    const actual = getKeygram(e);
    shortcuts.forEach(([expected, handler]) => actual === expected && handler(e));
    return e;
  };

  on("keydown", matchAndRun);
})();
