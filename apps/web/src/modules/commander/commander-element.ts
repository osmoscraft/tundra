import { fragmentFromHtml } from "../../utils/dom/create";
import { on, preventDefault, stopPropagation } from "../../utils/dom/event";
import { appenChild, clearHTML } from "../../utils/dom/mutation";
import { setKV } from "../../utils/lang/object";
import { pipe } from "../../utils/lang/pipe";
import { thunk } from "../../utils/lang/thunk";
import { getKeygram } from "../keyboard";
import htmlTemplate from "./commander-element.html?raw";

declare global {
  interface WindowEventMap {
    "commander.open": Event;
  }
}

export class CommanderElement extends HTMLElement {
  connectedCallback() {
    on("commander.open", (e) => {
      pipe(thunk(this), clearHTML, appenChild(fragmentFromHtml(htmlTemplate)))();
    });
    on(
      "keydown",
      (e) => {
        if (getKeygram(e) === "escape") {
          pipe(preventDefault, stopPropagation, thunk(setKV("innerHTML", "", this)))(e);
        }
      },
      this
    );
  }
}
