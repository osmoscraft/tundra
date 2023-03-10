import type { MessageToMainV2 } from "../../typings/messages";
import { attachShadowHtml } from "../../utils/dom";
import { loadWorker } from "./load-worker";
import template from "./worker-terminal-element.html";
export class WorkerTerminalElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private status = this.shadowRoot.querySelector("#status")!;
  private worker = loadWorker();

  connectedCallback() {
    this.worker.addEventListener("message", (e) => {
      const data = e.data as MessageToMainV2;

      if (data.log) {
        this.reportStatus(data.log);
      }
    });
  }

  private reportStatus(text: string) {
    this.status.textContent = [...this.status.textContent!.split("\n").filter(Boolean), text].slice(-100).join("\n");

    this.status.scrollTop = this.status.scrollHeight;
  }
}
