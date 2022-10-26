import {
  $,
  attachShadowById,
  autofocus,
  cacheFocus,
  containsActiveElement,
  ctor,
  emit,
  formDataToObject,
  getCombo,
  on,
  pipe,
  preventDefault,
  restoreFocus,
  startFocusTrap,
  stopFocusTrap,
  targetClosest,
} from "utils";
import { RemoteType } from "../server/db";
import { request } from "./request";

export class ConfigElement extends HTMLElement {
  shadowRoot = attachShadowById("config-template", this);

  connectedCallback() {
    const dialog = $("dialog", this.shadowRoot)!;
    const form = $("form", this.shadowRoot)!;
    const test = $("#test-remote", form)!;

    on("config.open-ui", async () => {
      if (containsActiveElement(form)) return;

      const remote = await request("getRemote");

      Object.entries(remote?.connection ?? {}).map(
        ([k, v]) => (form.querySelector<HTMLInputElement>(`[name="${k}"]`)!.value = v as string)
      ),
        (dialog.open = true);
      cacheFocus(form);
      startFocusTrap(() => autofocus(form), form); // force modal
      autofocus(form);
    });

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
        request("setRemote", {
          type: RemoteType.GitHubToken,
          connection: obj,
        }).then(() => {
          emit("sync.test-remote", { detail: obj });
          closeUI();
        });
      }),
      form
    );

    on(
      "click",
      pipe(
        targetClosest("form"),
        ctor(FormData),
        formDataToObject,
        (obj: any) => ({ detail: obj }),
        (init: any) => emit("sync.test-remote", init)
      ),
      test
    );
  }
}
