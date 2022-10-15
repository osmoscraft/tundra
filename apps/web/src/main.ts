import { openDB, runOnStore, tx } from "./features/db/db";
import { handleKeydownWithShortcut, Shortcut } from "./features/keyboard/shortcuts";
import { getInternalHrefFromClick, onPopState, pushUrl, routeSubject, selectInternalHrefClick } from "./features/router/router";
import "./main.css";
import { preventDefault } from "./utils/dom/event";
import { nullablePipe, pipe } from "./utils/functional/pipe";
import { tap } from "./utils/functional/tap";

async function main() {
  const db = await openDB("tinykb-db", 1, (db) => {
    db.createObjectStore("frame", { keyPath: "id" });
  });

  window.addEventListener("click", nullablePipe(selectInternalHrefClick, preventDefault, getInternalHrefFromClick, pushUrl));
  window.addEventListener("popstate", onPopState);

  routeSubject.addEventListener("afterRouteChange", async () => {
    const id = new URLSearchParams(window.location.search).get("id");
    const frames = await tx(db, "frame", "readonly", (tx) => runOnStore(tx, "frame", (store) => store.getAll()));
    console.log(frames);
  });

  const shortcuts: Shortcut[] = [["Ctrl-KeyK", "", pipe(tap(console.log), preventDefault)]];
  window.addEventListener("keydown", pipe(handleKeydownWithShortcut.bind(null, shortcuts)));
}

main();
