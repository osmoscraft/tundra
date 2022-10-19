import { attachShadowHtml, fragmentFromHtml } from "../../utils/dom/create";
import { on } from "../../utils/dom/event";
import { $ } from "../../utils/dom/query";
import htmlTemplate from "./hud-element.html?raw";

declare global {
  interface WindowEventMap {
    "hud.toggle": Event;
  }
}

export class HUDElement extends HTMLElement {
  shadowRoot = attachShadowHtml(htmlTemplate, this);

  connectedCallback() {
    on("log", (e) => {
      const container$ = $("code", this.shadowRoot)!;
      [console.log, renderDisplayMessage(container$)].map((fn) => fn(getDisplayMessage(e.detail.level, e.detail.message)));
      scrollToLast(container$);
    });
    on("hud.toggle", () => handleToggle($("code", this.shadowRoot)!));
  }
}

const getDisplayMessage = (level: Log.Level, message: string) =>
  `${level.toLocaleUpperCase()} ${new Date().toLocaleString("sv", { timeZoneName: "short" })} ${message}`;
const renderDisplayMessage = (container: Element) => (displayMessage: string) => container.appendChild(fragmentFromHtml(`<div>${displayMessage}</div>`));

const handleToggle = (container: HTMLElement) => {
  container.classList.toggle("expanded");
  container.lastElementChild?.scrollIntoView();
};

const scrollToLast = (container: HTMLElement) => {
  container.lastElementChild?.scrollIntoView();
};
