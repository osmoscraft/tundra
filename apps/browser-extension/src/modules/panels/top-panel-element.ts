import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./top-panel-element.html";

export class TopPanelElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
}
