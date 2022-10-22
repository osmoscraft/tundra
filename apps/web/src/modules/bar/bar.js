import { $, attachShadowHtml, fragmentFromHtml, on } from "utils";
import htmlTemplate from "./bar.html?raw";

export class BarElement extends HTMLElement {
  shadowRoot = attachShadowHtml(htmlTemplate, this);

  connectedCallback() {
    on("log.append", (e) => {
      const container$ = $("code", this.shadowRoot);
      renderDisplayMessage(container$)(getDisplayMessage(e.detail.level, e.detail.message));
      scrollToLast(container$);
    });
    on("bar.toggle", () => handleToggle($("code", this.shadowRoot)));
  }
}

const getDisplayMessage = (level, message) =>
  `<span data-level="${level}">${new Date().toLocaleString("sv", { timeZoneName: "short" })} ${message}<span>`;
const renderDisplayMessage = (container) => (displayMessage) =>
  container.appendChild(fragmentFromHtml(`<div>${displayMessage}</div>`));

const handleToggle = (container) => {
  container.classList.toggle("expanded");
  container.lastElementChild?.scrollIntoView();
};

const scrollToLast = (container) => {
  container.lastElementChild?.scrollIntoView();
};
