import {
  $,
  attachShadowById,
  autofocus,
  cacheFocus,
  callKA_,
  containsActiveElement,
  ctor,
  emit,
  forgetFocus,
  getCombo,
  on,
  pipe,
  preventDefault,
  restoreFocus,
  startFocusTrap,
  stopFocusTrap,
  tap,
  targetClosest,
} from "utils";

export class ActionBarElement extends HTMLElement {
  shadowRoot = attachShadowById("action-bar-template", this);

  connectedCallback() {
    const form = $("form", this.shadowRoot)!;
    const input = $("input", form)!;

    on("action-bar.enter", () => {
      if (containsActiveElement(form)) return;

      cacheFocus(form);
      startFocusTrap(() => {
        forgetFocus(form);
        emit("action-bar.exit");
      }, form);
      input.tabIndex = 0;
      autofocus(form);
    });

    on("action-bar.exit", () => {
      stopFocusTrap(form);
      restoreFocus(form);
      input.tabIndex = -1;
    });

    on("mousedown", () => emit("action-bar.enter"), form);

    on("keydown", (e) => {
      const combo = getCombo(e);
      if (combo === "escape") {
        emit("action-bar.exit");
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
