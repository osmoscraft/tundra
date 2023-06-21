import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./status-bar-element.html";

export class StatusBarElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);

  connectedCallback() {
    this.setText("Loading...");
  }

  setText(text: string) {
    this.shadowRoot.getElementById("message")!.textContent = text;
    this.shadowRoot.getElementById("time")!.textContent = new Date().toLocaleTimeString();
  }
}
