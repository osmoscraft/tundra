import { handleKeydownWithShortcut, Shortcut } from "./features/keyboard/shortcuts";
import "./main.css";

const shortcuts: Shortcut[] = [["Ctrl-KeyK", "", console.log]];
window.addEventListener("keydown", handleKeydownWithShortcut.bind(null, shortcuts));

async function main() {}

main();
