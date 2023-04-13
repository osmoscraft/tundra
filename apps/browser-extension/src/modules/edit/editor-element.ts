import "./editor-element.css";
import template from "./editor-element.html";
export class EditorElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = template;
  }
}
