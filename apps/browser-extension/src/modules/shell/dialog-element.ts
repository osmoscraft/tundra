import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./dialog-element.html";

export class DialogElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private dialog = this.shadowRoot.querySelector("dialog")!;

  setContentElement(element: HTMLElement) {
    this.dialog.innerHTML = "";
    this.dialog.appendChild(element);
    this.dialog.showModal();
  }
}
