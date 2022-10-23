import { $, attachShadowHtml, autofocus, stopTrapFocus, trapFocus } from "utils";
import { on } from "../../utils/dom/event";
import { getKeygram } from "../../utils/dom/keyboard";
import menuHtml from "./menu.html?raw";

export class MenuElement extends HTMLElement {
  shadowRoot = attachShadowHtml(menuHtml, this);

  connectedCallback() {
    on("menu.open", () => {
      $("dialog", this.shadowRoot)!.open = true;
      autofocus(this.shadowRoot);
      trapFocus($("dialog", this.shadowRoot));
    });

    on("keydown", (e) => {
      const keygram = getKeygram(e);
      if (keygram === "escape") {
        $("dialog", this.shadowRoot)!.open = false;
        stopTrapFocus($("dialog", this.shadowRoot));
      }
    });
  }
}
