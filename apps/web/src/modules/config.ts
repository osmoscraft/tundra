import {
  $,
  attachShadowById,
  autofocus,
  cacheFocus,
  containsActiveElement,
  ctor,
  emit,
  getCombo,
  on,
  pipe,
  preventDefault,
  restoreFocus,
  startFocusTrap,
  stopFocusTrap,
  targetClosest,
} from "utils";
import { formDataToObject } from "../utils/dom/form";

export class ConfigElement extends HTMLElement {
  shadowRoot = attachShadowById("config-template", this);

  connectedCallback() {
    const dialog = $("dialog", this.shadowRoot)!;
    const form = $("form", this.shadowRoot)!;
    const test = $("#test-remote", form)!;

    on("config.open-ui", () => {
      if (containsActiveElement(form)) return;

      emit("db.request-tx", {
        detail: {
          tid: 1, // Generate id with req-res abstraction
          tname: "getRemote",
          src: this.shadowRoot,
        },
      });

      dialog.open = true;
      cacheFocus(form);
      startFocusTrap(() => autofocus(form), form); // force modal
      autofocus(form);
    });

    on(
      "db.respond-tx", // TODO make sure only handle when tid matches
      (e) =>
        Object.entries(e.detail.result).map(
          ([k, v]) => (form.querySelector<HTMLInputElement>(`[name="${k}"]`)!.value = v as string)
        ),
      this.shadowRoot
    );

    const closeUI = () => {
      dialog.open = false;
      stopFocusTrap(form);
      restoreFocus(form);
    };

    on("keydown", (e) => {
      const combo = getCombo(e);
      if (combo === "escape") {
        closeUI();
      }
    });

    on(
      "submit",
      pipe(preventDefault, targetClosest("form"), ctor(FormData), formDataToObject, (obj: any) => {
        // TODO create req-res abstraction so sender can wait for done signal
        emit("db.request-tx", {
          detail: {
            tid: 2, // Generate id with req-res abstraction
            tname: "setRemote",
            targs: [obj],
            src: this.shadowRoot,
          },
        });

        emit("fs.test-remote", { detail: obj });
        closeUI();
      }),
      form
    );

    on(
      "click",
      pipe(targetClosest("form"), ctor(FormData), formDataToObject, (obj: any) => {
        emit("fs.test-remote", { detail: obj });
      }),
      test
    );
  }
}
