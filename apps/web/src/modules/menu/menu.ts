import { $, attachShadowHtml, autofocus, getKeygram, on, startFocusTrap, stopTrapFocus } from "utils";
import menuHtml from "./menu.html?raw";

export class MenuElement extends HTMLElement {
  shadowRoot = attachShadowHtml(menuHtml, this);

  connectedCallback() {
    on("menu.open", () => {
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
  }
}
