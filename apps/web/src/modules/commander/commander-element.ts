import { attachShadowHtml, fragmentFromHtml } from "../../utils/dom/create";
import { on, preventDefault, stopPropagation } from "../../utils/dom/event";
import { appendParentWith, clearHTML } from "../../utils/dom/mutation";
import { pipe } from "../../utils/lang/pipe";
import { thunk } from "../../utils/lang/thunk";
import { when } from "../../utils/lang/when";
import { autofocusIn } from "../focus";
import { getKeygram } from "../keyboard";
import htmlTemplate from "./commander-element.html?raw";

declare global {
  interface WindowEventMap {
    "commander.open": Event;
  }
}

export class CommanderElement extends HTMLElement {
  shadowRoot = attachShadowHtml("", this);

  connectedCallback() {
    const clearContent = clearHTML.bind(null, this.shadowRoot);
    const renderContent = pipe(thunk(htmlTemplate), fragmentFromHtml, appendParentWith(this.shadowRoot));
    const isEscape = (e: KeyboardEvent) => getKeygram(e) === "escape";
    const teardown = pipe(preventDefault, stopPropagation, clearContent);
    const closeOnEscape = when(isEscape, teardown);

    on("commander.open", pipe(clearContent, renderContent, autofocusIn(this.shadowRoot)));
    on("keydown", closeOnEscape, this.shadowRoot);
    on("submit", preventDefault, this.shadowRoot);
  }
}
