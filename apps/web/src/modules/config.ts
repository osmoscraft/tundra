import { $, attachShadowById, autofocus, getCombo, on, startFocusTrap, stopTrapFocus } from "utils";

export class ConfigElement extends HTMLElement {
  shadowRoot = attachShadowById("config-template", this);

  connectedCallback() {
    on("config.open", () => {
      $("dialog", this.shadowRoot)!.open = true;
      autofocus(this.shadowRoot);
      startFocusTrap($("dialog", this.shadowRoot)!);
    });

    on("keydown", (e) => {
      const combo = getCombo(e);
      if (combo === "escape") {
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
