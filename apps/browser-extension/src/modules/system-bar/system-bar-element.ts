import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./system-bar-element.html";

export class SystemBarElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
}
