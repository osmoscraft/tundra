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
  getDetail,
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
    const list = $("ul", form)!;
    const renderToList = renderCommands.bind(null, list);

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
      renderToList([]);
    });

    on("mousedown", () => emit("action-bar.enter"), form);

    on("keydown", (e) => {
      const combo = getCombo(e);
      if (combo === "escape") {
        if (input.value.length) {
          form.reset();
          renderToList([]);
        } else {
          emit("action-bar.exit");
        }
      }
    });

    on("command.respond-match", pipe(getDetail, renderToList), this);

    on("focus", () => emit("command.request-match", { detail: input.value, bubbles: true }, this), input);
    on("input", () => emit("command.request-match", { detail: input.value, bubbles: true }, this), input);

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

const renderCommands = (container: Element, commands: string[]) => {
  container.innerHTML = commands.map((cmd) => `<li><button type="button" tabindex="-1">${cmd}</button></li>`).join("");
};
