import { attachShadowHtml } from "../../utils/dom";
import template from "./editor-element.html";

export interface EditorData {
  title: string;
  url: string;
}

export class EditorElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;

  connectedCallback() {}

  load(data: EditorData) {
    this.form.querySelector<HTMLInputElement>("#url")!.value = data.url;
    this.form.querySelector<HTMLInputElement>("#title")!.value = data.title;
  }
}
