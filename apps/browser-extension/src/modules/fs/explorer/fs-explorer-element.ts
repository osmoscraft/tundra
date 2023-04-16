import { attachShadowHtml } from "@tinykb/dom-utils";
import { getDbWorkerProxy } from "../../../db-worker-proxy";
import template from "./db-devtool-element.html";

export class DbDevtoolElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private fileList = this.shadowRoot.querySelector("ul")!;
  private article = this.shadowRoot.querySelector("article")!;
  private worker = getDbWorkerProxy();

  connectedCallback() {
    this.worker.request({ requestFsRecent: true }).then(({ respondFsRecent }) => {});
  }
}
