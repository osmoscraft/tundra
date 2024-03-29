import { $, attachShadowById, fragmentFromHtml, on, pipe, setKV_ } from "utils";

export class StatusBarElement extends HTMLElement {
  shadowRoot = attachShadowById("status-bar-template", this);

  connectedCallback() {
    const code = $("code", this.shadowRoot)!;

    on("log.append", (e) =>
      pipe(renderDisplayMessage(getMessageHtml(e.detail.level, e.detail.message)), scrollToLast)(code)
    );
    on("status-bar.toggle", () => handleToggle(code));
    on("status-bar.clear", () => handleClear(code));
  }
}

const getMessageHtml = (level: string, message: string) =>
  `<div><span data-level="${level.toLocaleUpperCase()}">${new Date().toLocaleString("sv", {
    timeZoneName: "short",
  })} ${message}</span></div.`;

const renderDisplayMessage = (displayMessage: string) => (container: Element) => (
  container.appendChild(fragmentFromHtml(displayMessage)), container
);

const handleToggle = (container: HTMLElement) => {
  container.classList.toggle("expanded");
  container.lastElementChild?.scrollIntoView();
};

const scrollToLast = (container: HTMLElement) => {
  container.lastElementChild?.scrollIntoView();
};

const handleClear = setKV_("innerHTML", "");
