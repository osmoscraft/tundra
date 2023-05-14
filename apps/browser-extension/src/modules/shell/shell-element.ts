import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./shell-element.html";

export class ShellElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
}
