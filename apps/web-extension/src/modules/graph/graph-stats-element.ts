import { attachShadowHtml } from "../../utils/dom";
import template from "./graph-stats-element.html";

export class GraphStatsElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
}
