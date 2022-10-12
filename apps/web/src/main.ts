import { handleKeydownWithShortcut, Shortcut } from "./features/keyboard/shortcuts";
import "./main.css";
import { preventDefault } from "./utils/dom/event";
import { pipe } from "./utils/functional/pipe";
import { tap } from "./utils/functional/tap";

const shortcuts: Shortcut[] = [["Ctrl-KeyK", "", pipe(tap(console.log), preventDefault)]];
window.addEventListener("keydown", pipe(handleKeydownWithShortcut.bind(null, shortcuts)));

async function main() {}

main();
