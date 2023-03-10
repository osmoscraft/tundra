import type { MessageToMainV2, MessageToWorkerV2 } from "../../typings/messages";
import { attachShadowHtml } from "../../utils/dom";
import { loadWorker } from "../worker/load-worker";
import { getNotifier, getRequester } from "../worker/notify";
import template from "./capture-form-element.html";

export interface Page {
  url: string;
  title: string;
  target_urls: {
    title: string;
    url: string;
  }[];
}

export class CaptureFormElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private worker = loadWorker();
  private notifyWorker = getNotifier<MessageToWorkerV2>(this.worker);
  private requestWorker = getRequester<MessageToWorkerV2, MessageToMainV2>(this.worker);

  connectedCallback() {
    this.form.addEventListener("submit", (e) => e.preventDefault());
  }

  loadPage(page: Page) {
    this.shadowRoot.querySelector<HTMLInputElement>("#url")!.value = page.url!;
    this.shadowRoot.querySelector<HTMLInputElement>("#title")!.value = page.title!;
    this.shadowRoot.querySelector<HTMLUListElement>("#target-url-list")!.innerHTML = page.target_urls
      .map(
        (url) => /*html*/ `
      <li><a href="${url.url}" target="_blank">${url.title}</a></li>
    `
      )
      .join("");
  }
}
