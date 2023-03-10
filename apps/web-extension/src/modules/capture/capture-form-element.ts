import type { MessageToMainV2, MessageToWorkerV2 } from "../../typings/messages";
import { attachShadowHtml } from "../../utils/dom";
import { loadWorker } from "../worker/load-worker";
import { getNotifier, getRequester } from "../worker/notify";
import template from "./capture-form-element.html";
import type { Extraction } from "./extract-links";

export interface CaptureData {
  url: string;
  title: string;
}

export class CaptureFormElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private worker = loadWorker();
  private notifyWorker = getNotifier<MessageToWorkerV2>(this.worker);
  private requestWorker = getRequester<MessageToWorkerV2, MessageToMainV2>(this.worker);

  connectedCallback() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();

      const captureData = new FormData(this.form);

      this.notifyWorker({
        requestCapture: {
          url: captureData.get("url") as string,
          title: captureData.get("title") as string,
        },
      });
    });
  }

  loadExtractionResult(extraction: Extraction) {
    this.shadowRoot.querySelector<HTMLInputElement>("#url")!.value = extraction.url!;
    this.shadowRoot.querySelector<HTMLInputElement>("#title")!.value = extraction.title!;
    this.shadowRoot.querySelector<HTMLUListElement>("#target-url-list")!.innerHTML = extraction.targetUrls
      .map(
        (url) => /*html*/ `
      <li><a href="${url.url}" target="_blank">${url.title}</a></li>
    `
      )
      .join("");
  }
}
