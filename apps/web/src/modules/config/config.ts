import { $, attachShadowHtml, autofocus, getKeygram, on, startFocusTrap, stopTrapFocus } from "utils";
import html from "./settings.html?raw";

export class ConfigElement extends HTMLElement {
  shadowRoot = attachShadowHtml(html, this);

  connectedCallback() {
    on("config.open", () => {
      $("dialog", this.shadowRoot)!.open = true;
      autofocus(this.shadowRoot);
      startFocusTrap($("dialog", this.shadowRoot)!);
    });

    on("keydown", (e) => {
      const keygram = getKeygram(e);
      if (keygram === "escape") {
        $("dialog", this.shadowRoot)!.open = false;
        stopTrapFocus($("dialog", this.shadowRoot)!);
      }
    });

    on(
      "submit",
      (e) => {
        e.preventDefault();
      },
      $("form", this)!
    );
  }
}
