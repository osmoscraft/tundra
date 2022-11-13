import { attachHtml } from "../../utils/dom/factory";
import template from "./config-form.html";

export class ConfigElement extends HTMLElement {
  shadowRoot = attachHtml(template, this);
}
