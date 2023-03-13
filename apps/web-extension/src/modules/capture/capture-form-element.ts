import { attachShadowHtml } from "../../utils/dom";
import { loadWorker } from "../worker/load-worker";
import template from "./capture-form-element.html";
import type { Extraction } from "./extract-links";

export interface CaptureRequest {
  isUpdate: boolean;
  path: string;
  url: string;
  title: string;
  description: string;
  links: {
    title: string;
    url: string;
  }[];
}

export class CaptureFormElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private linkList = this.shadowRoot.getElementById("link-list") as HTMLUListElement;
  private submit = this.shadowRoot.querySelector(`button[type="submit"]`) as HTMLButtonElement;
  private worker = loadWorker();

  connectedCallback() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();

      const captureData = new FormData(this.form);

      const existingPath = captureData.get("path") as string;

      this.dispatchEvent(
        new CustomEvent<CaptureRequest>("request-capture", {
          detail: {
            isUpdate: !!existingPath,
            path: existingPath ? existingPath : `nodes/${Date.now()}.json`,
            url: captureData.get("url") as string,
            title: captureData.get("title") as string,
            description: captureData.get("description") as string,
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

  loadExisting(extraction: Extraction, path: string) {
    this.form.querySelector<HTMLInputElement>("#path")!.value = path;
    this.form.querySelector<HTMLInputElement>("#url")!.value = extraction.url!;
    this.form.querySelector<HTMLInputElement>("#title")!.value = extraction.title!;
    this.form.querySelector<HTMLInputElement>("#description")!.value = extraction.description!;
    this.linkList!.innerHTML = extraction.links
      .map(
        (url) => /*html*/ `
      <li><a href="${url.url}" target="_blank">${url.title}</a></li>
    `
      )
      .join("");

    this.submit.textContent = "Update";
  }

  loadExtractionResult(extraction: Extraction) {
    this.form.querySelector<HTMLInputElement>("#path")!.value = "";
    this.form.querySelector<HTMLInputElement>("#url")!.value = extraction.url!;
    this.form.querySelector<HTMLInputElement>("#title")!.value = extraction.title!;
    this.form.querySelector<HTMLInputElement>("#description")!.value = "";
    this.linkList!.innerHTML = extraction.links
      .map(
        (url) => /*html*/ `
      <li><a href="${url.url}" target="_blank">${url.title}</a></li>
    `
      )
      .join("");

    this.submit.textContent = "Capture";
  }
}
