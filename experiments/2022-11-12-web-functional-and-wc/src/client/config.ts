import {
  $,
  attachShadowById,
  autofocus,
  cacheFocus,
  containsActiveElement,
  ctor,
  formDataToObject,
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
import { RemoteType } from "../server/db";
import { logInfo } from "./log";
import { request } from "./worker";

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
      pipe(preventDefault, targetClosest("form"), ctor(FormData), formDataToObject, async (obj: any) => {
        request("setRemote", {
          type: RemoteType.GitHubToken,
          connection: obj,
        })
          .then(closeUI)
          .then(logTestStart)
          .then(() => request("testRemote", wrapAsGitHubTokenRemote(obj)))
          .then(logTestResult);
      }),
      form
    );

    on(
      "click",
      pipe(
        targetClosest("form"),
        ctor(FormData),
        formDataToObject,
        tap(logTestStart),
        wrapAsGitHubTokenRemote,
        (remote: any) => requestTestRemote(remote),
        (isSuccess: Promise<boolean>) => isSuccess.then(logTestResult)
      ),
      test
    );
  }
}

const wrapAsGitHubTokenRemote = <T>(connection: T) => ({ type: RemoteType.GitHubToken, connection });
const requestTestRemote = (req: any) => request("testRemote", req);
const logTestStart = () => logInfo("Testing remote...");
const logTestResult = (isSuccess: boolean) => logInfo(`Testing remote... ${isSuccess ? "Success" : "Failed"}!`);
