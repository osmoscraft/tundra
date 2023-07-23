import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./bottom-panel-element.html";

export class BottomPanelElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
}
