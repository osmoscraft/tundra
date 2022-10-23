import {
  $,
  attachShadowHtml,
  autofocus,
  emit,
  getCombo,
  on,
  pipe,
  preventDefault,
  startFocusTrap,
  stopTrapFocus,
  tap,
  targetClosest,
} from "utils";
import { callKA_, ctor } from "../../utils/fp/object";
import html from "./menu.html?raw";

export class MenuElement extends HTMLElement {
  shadowRoot = attachShadowHtml(html, this);

  connectedCallback() {
    const dialog = $("dialog", this.shadowRoot)!;
    const form = $("form", dialog)!;

    on("menu.open", () => {
      dialog.open = true;
      autofocus(this.shadowRoot);
      startFocusTrap(dialog);
    });

    on("menu.close", () => {
      dialog.open = false;
      stopTrapFocus(dialog);
    });

    on("keydown", (e) => {
      const combo = getCombo(e);
      if (combo === "escape") {
        emit("menu.close");
      }
    });

    on(
      "submit",
      pipe(
        preventDefault,
        targetClosest("form"),
        tap(
          pipe(
            ctor(FormData),
            callKA_("get", "command"),
            tap(() => emit("menu.close")),
            (cmd: string) => emit("command.exec", { detail: cmd })
          )
        ),
        callKA_("reset")
      ),
      form
    );
  }
}
