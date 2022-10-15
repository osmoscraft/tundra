import { openDB, runOnStore, tx } from "./features/db/db";
import { migrateTov1 } from "./features/db/migrations";
import { handleKeydownWithShortcut, Shortcut } from "./features/keyboard/shortcuts";
import { getInternalHrefFromClick, onPopState, pushUrl, routeSubject, selectInternalHrefClick, startRouter } from "./features/router/router";
import "./main.css";
import { preventDefault } from "./utils/dom/event";
import { nullablePipe, pipe } from "./utils/functional/pipe";
import { tap } from "./utils/functional/tap";

async function main() {
  const db = await openDB("tinykb-db", 1, migrateTov1);

  window.addEventListener("click", nullablePipe(selectInternalHrefClick, preventDefault, getInternalHrefFromClick, pushUrl));
  window.addEventListener("popstate", onPopState);

  const shortcuts: Shortcut[] = [["Ctrl-KeyK", "", pipe(tap(console.log), preventDefault)]];
  window.addEventListener("keydown", pipe(handleKeydownWithShortcut.bind(null, shortcuts)));

  routeSubject.addEventListener("afterRouteChange", handleRouteChange.bind(null, db));
  startRouter();
}

async function handleRouteChange(db: IDBDatabase) {
  const id = new URLSearchParams(window.location.search).get("id");
  console.log("debug", id);
  const frames = await tx(db, "frame", "readonly", (tx) => runOnStore(tx, "frame", (store) => store.getAll()));
  console.log(frames);
}

main();
