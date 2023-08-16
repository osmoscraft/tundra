import "./status-bar-element.css";
import template from "./status-bar-element.html";

export class StatusBarElement extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = template;
  }

  connectedCallback() {
    this.setText("Loading...");
  }

  setText(text: string) {
    this.querySelector("#status__message")!.textContent = text;
    this.querySelector("#status__time")!.textContent = new Date().toLocaleTimeString();
  }
}
