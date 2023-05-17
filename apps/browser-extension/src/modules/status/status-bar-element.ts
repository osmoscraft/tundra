import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./status-bar-element.html";

export class StatusBarElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
}
