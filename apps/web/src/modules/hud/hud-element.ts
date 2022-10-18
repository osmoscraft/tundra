import { fragmentFromHtml, shadowFromHtml } from "../../utils/dom/create";
import { on } from "../../utils/dom/event";
import { $ } from "../../utils/dom/query";
import htmlTemplate from "./hud-element.html?raw";

declare global {
  interface WindowEventMap {
    "hud.toggle": Event;
  }
}

export class HUDElement extends HTMLElement {
  constructor() {
    super();

    shadowFromHtml(htmlTemplate, this);
  }

  connectedCallback() {
    on("log", (e) => [console.log, renderDisplayMessage($("code", this.shadowRoot!)!)].map((fn) => fn(getDisplayMessage(e.detail.level, e.detail.message))));
    on("hud.toggle", () => $("code", this.shadowRoot!)!.classList.toggle("expanded"));
  }
}

const getDisplayMessage = (level: Log.Level, message: string) =>
  `${`[${level}]`.padStart(7)} ${new Date().toLocaleString("sv", { timeZoneName: "short" })} ${message}`;
const renderDisplayMessage = (container: Element) => (displayMessage: string) => container.appendChild(fragmentFromHtml(`<div>${displayMessage}</div>`));
