import type { MessageToMainV2, MessageToWorkerV2 } from "../../typings/messages";
import { attachShadowHtml } from "../../utils/dom";
import { loadWorker } from "../worker/load-worker";
import { getNotifier, getRequester } from "../worker/notify";
import template from "./capture-form-element.html";

export class CaptureFormElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private worker = loadWorker();
  private notifyWorker = getNotifier<MessageToWorkerV2>(this.worker);
  private requestWorker = getRequester<MessageToWorkerV2, MessageToMainV2>(this.worker);

  connectedCallback() {
    this.form.addEventListener("submit", (e) => e.preventDefault());
  }
}
