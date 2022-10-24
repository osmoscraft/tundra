import {
  $,
  attachShadowById,
  autofocus,
  callKA_,
  ctor,
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

export class ActionBarElement extends HTMLElement {
  shadowRoot = attachShadowById("action-bar-template", this);

  connectedCallback() {
    const form = $("form", this.shadowRoot)!;

    on("action-bar.enter", () => {
      startFocusTrap(form);
      autofocus(this.shadowRoot);
    });

    on("action-bar.exit", () => {
      stopTrapFocus(form);
    });

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
