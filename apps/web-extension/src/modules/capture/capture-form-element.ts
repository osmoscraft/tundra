import type { MessageToMainV2, MessageToWorkerV2 } from "../../typings/messages";
import { attachShadowHtml } from "../../utils/dom";
import { loadWorker } from "../worker/load-worker";
import { getNotifier, getRequester } from "../worker/notify";
import template from "./capture-form-element.html";
import type { Extraction } from "./extract-links";

export interface CaptureData {
  url: string;
  title: string;
  links: {
    title: string;
    url: string;
  }[];
}

export class CaptureFormElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private linkList = this.shadowRoot.getElementById("link-list") as HTMLUListElement;
  private worker = loadWorker();
  private notifyWorker = getNotifier<MessageToWorkerV2>(this.worker);
  private requestWorker = getRequester<MessageToWorkerV2, MessageToMainV2>(this.worker);

  connectedCallback() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();

      const captureData = new FormData(this.form);

      this.dispatchEvent(
        new CustomEvent<CaptureData>("request-capture", {
          detail: {
            url: captureData.get("url") as string,
            title: captureData.get("title") as string,
            links: [...this.linkList.querySelectorAll("a")].map((anchor) => ({
              title: anchor.innerText,
              url: anchor.href,
            })),
          },
        })
      );
    });
  }

  reset() {
    this.form.reset();
  }

  loadExtractionResult(extraction: Extraction) {
    this.form.querySelector<HTMLInputElement>("#url")!.value = extraction.url!;
    this.form.querySelector<HTMLInputElement>("#title")!.value = extraction.title!;
    this.linkList!.innerHTML = extraction.links
      .map(
        (url) => /*html*/ `
      <li><a href="${url.url}" target="_blank">${url.title}</a></li>
    `
      )
      .join("");
  }
}
