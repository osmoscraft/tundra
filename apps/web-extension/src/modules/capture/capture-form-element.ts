import type { Extraction } from "../../extract-links";
import { attachShadowHtml } from "../../utils/dom";
import template from "./capture-form-element.html";

export interface CaptureRequest {
  node: {
    path: string;
    url: string;
    altUrls: string[];
    title: string;
    description: string;
    links: {
      title: string;
      url: string;
    }[];
    tags: string[];
  };
  isUpdate: boolean;
}

export class CaptureFormElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private linkList = this.shadowRoot.getElementById("link-list") as HTMLUListElement;
  private submit = this.shadowRoot.querySelector(`button[type="submit"]`) as HTMLButtonElement;
  private altUrlList = this.shadowRoot.getElementById("alt-url-list") as HTMLUListElement;

  connectedCallback() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();

      const captureData = new FormData(this.form);

      const existingPath = captureData.get("path") as string;

      this.dispatchEvent(
        new CustomEvent<CaptureRequest>("request-capture", {
          detail: {
            node: {
              path: existingPath ? existingPath : `nodes/${Date.now()}.json`,
              url: captureData.get("url") as string,
              altUrls: [...this.altUrlList.querySelectorAll("li")].map((item) => item.textContent!),
              title: captureData.get("title") as string,
              description: captureData.get("description") as string,
              tags: (captureData.get("tags") as string)
                .split(",")
                .filter(Boolean)
                .map((tag) => tag.trim())
                .sort(),
              links: [...this.linkList.querySelectorAll("a")].map((anchor) => ({
                title: anchor.innerText,
                url: anchor.href,
              })),
            },
            isUpdate: !!existingPath,
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
    this.form.querySelector<HTMLInputElement>("#url")!.value = extraction.url;
    this.altUrlList.innerHTML = extraction.altUrls.map((url) => `<li>${url}</li>`).join("");
    this.form.querySelector<HTMLInputElement>("#title")!.value = extraction.title;
    this.form.querySelector<HTMLInputElement>("#description")!.value = extraction.description ?? "";
    this.form.querySelector<HTMLInputElement>("#tags")!.value = extraction.tags?.join(", ") ?? "";
    this.linkList!.innerHTML =
      extraction.links
        ?.map(
          (url) => /*html*/ `
      <li><a href="${url.url}" target="_blank">${url.title}</a></li>
    `
        )
        .join("") ?? "";

    this.submit.textContent = "Update";
  }

  loadExtractionResult(extraction: Extraction) {
    this.form.querySelector<HTMLInputElement>("#path")!.value = "";
    this.form.querySelector<HTMLInputElement>("#url")!.value = extraction.url!;
    this.altUrlList.innerHTML = extraction.altUrls.map((url) => `<li>${url}</li>`).join("");
    this.form.querySelector<HTMLInputElement>("#title")!.value = extraction.title!;
    this.form.querySelector<HTMLInputElement>("#description")!.value = "";
    this.form.querySelector<HTMLInputElement>("#tags")!.value = extraction.tags?.join(", ") ?? "";
    this.linkList!.innerHTML =
      extraction.links
        ?.map(
          (url) => /*html*/ `
      <li><a href="${url.url}" target="_blank">${url.title}</a></li>
    `
        )
        .join("") ?? "";

    this.submit.textContent = "Capture";
  }
}
