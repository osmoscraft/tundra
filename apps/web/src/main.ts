import { handleKeydownWithShortcut, Shortcut } from "./features/keyboard/shortcuts";
import "./main.css";
import { pipe } from "./utils/pipe";

const shortcuts: Shortcut[] = [["Ctrl-KeyK", "", console.log]];
window.addEventListener("keydown", pipe(handleKeydownWithShortcut.bind(null, shortcuts)));

async function main() {}

main();
