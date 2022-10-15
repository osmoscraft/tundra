import { handleKeydownWithShortcut, Shortcut } from "./features/keyboard/shortcuts";
import { getInternalHrefFromClick, onPopState, pushUrl, routeSubject, selectInternalHrefClick } from "./features/router/router";
import "./main.css";
import { preventDefault } from "./utils/dom/event";
import { nullablePipe, pipe } from "./utils/functional/pipe";
import { tap } from "./utils/functional/tap";

async function main() {
  window.addEventListener("click", nullablePipe(selectInternalHrefClick, preventDefault, getInternalHrefFromClick, pushUrl));
  window.addEventListener("popstate", onPopState);

  routeSubject.addEventListener("afterRouteChange", () => {
    const id = new URLSearchParams(window.location.search).get("id");
    console.log(id);
  });

  const shortcuts: Shortcut[] = [["Ctrl-KeyK", "", pipe(tap(console.log), preventDefault)]];
  window.addEventListener("keydown", pipe(handleKeydownWithShortcut.bind(null, shortcuts)));
}

main();
