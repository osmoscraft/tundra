import { $, attachShadowById, autofocus, getCombo, on, startFocusTrap, stopFocusTrap } from "utils";

export class ConfigElement extends HTMLElement {
  shadowRoot = attachShadowById("config-template", this);

  connectedCallback() {
    const form = $("form", this.shadowRoot)!;

    on("config.open", () => {
      $("dialog", this.shadowRoot)!.open = true;
      autofocus(this.shadowRoot);
      startFocusTrap(() => {}, form);
    });

    on("keydown", (e) => {
      const combo = getCombo(e);
      if (combo === "escape") {
        $("dialog", this.shadowRoot)!.open = false;
        stopFocusTrap(form);
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
