import { attachShadowHtml } from "../../utils/dom";
import template from "./editor-element.html";

export interface EditorData {
  path: string;
  title: string;
  url: string;
  links: {
    title: string;
    url: string;
  }[];
}

export class EditorElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private linkList = this.shadowRoot.getElementById("link-list") as HTMLUListElement;

  connectedCallback() {}

  load(data: EditorData) {
    this.form.querySelector<HTMLInputElement>("#path")!.value = data.path;
    this.form.querySelector<HTMLInputElement>("#url")!.value = data.url;
    this.form.querySelector<HTMLInputElement>("#title")!.value = data.title;
    this.linkList!.innerHTML = data.links
      .map(
        (url) => /*html*/ `
      <li><a href="${url.url}" target="_blank">${url.title}</a></li>
    `
      )
      .join("");
  }
}
