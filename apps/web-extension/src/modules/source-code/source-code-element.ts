import { attachShadowHtml } from "../../utils/dom";
import template from "./source-code-element.html";

export interface SourceCodeData {
  path: string;
  content: any;
}

export class SourceCodeElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;

  connectedCallback() {}

  load(data: SourceCodeData) {
    this.form.querySelector<HTMLInputElement>("#path")!.value = data.path;
    this.shadowRoot.querySelector("code")!.innerText = JSON.stringify(data.content, null, 2);
  }
}
