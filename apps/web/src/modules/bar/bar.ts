import { $, attachShadowHtml, fragmentFromHtml, on, pipe } from "utils";
import html from "./bar.html?raw";

declare global {
  interface WindowEventMap {
    "bar.toggle": Event;
  }
}

export class BarElement extends HTMLElement {
  shadowRoot = attachShadowHtml(html, this);

  connectedCallback() {
    const code = $("code", this.shadowRoot)!;

    on("log.append", (e) =>
      pipe(renderDisplayMessage(getDisplayMessage(e.detail.level, e.detail.message)), scrollToLast)(code)
    );
    on("bar.toggle", () => handleToggle($("code", this.shadowRoot)!));
  }
}

const getDisplayMessage = (level: string, message: string) =>
  `<span data-level="${level.toLocaleUpperCase()}">${new Date().toLocaleString("sv", {
    timeZoneName: "short",
  })} ${message}</span>`;
const renderDisplayMessage = (displayMessage: string) => (container: Element) => (
  container.appendChild(fragmentFromHtml(`<div>${displayMessage}</div>`)), container
);

const handleToggle = (container: HTMLElement) => {
  container.classList.toggle("expanded");
  container.lastElementChild?.scrollIntoView();
};

const scrollToLast = (container: HTMLElement) => {
  container.lastElementChild?.scrollIntoView();
};
