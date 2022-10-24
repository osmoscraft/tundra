import {
  $,
  attachShadowById,
  autofocus,
  cacheFocus,
  containsActiveElement,
  getCombo,
  on,
  restoreFocus,
  startFocusTrap,
  stopFocusTrap,
} from "utils";

export class ConfigElement extends HTMLElement {
  shadowRoot = attachShadowById("config-template", this);

  connectedCallback() {
    const dialog = $("dialog", this.shadowRoot)!;
    const form = $("form", this.shadowRoot)!;

    on("config.open", () => {
      if (containsActiveElement(form)) return;

      dialog.open = true;
      cacheFocus(form);
      startFocusTrap(() => autofocus(form), form); // force modal
      autofocus(form);
    });

    on("keydown", (e) => {
      const combo = getCombo(e);
      if (combo === "escape") {
        dialog.open = false;
        stopFocusTrap(form);
        restoreFocus(form);
      }
    });

    on(
      "submit",
      (e) => {
        e.preventDefault();
      },
      form
    );
  }
}
