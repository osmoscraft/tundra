import { attachHtml } from "../../utils/dom/factory";
import { request, subscribe } from "../../utils/rpc/client";
import { port } from "../global/port";
import template from "./config-form.html";

export class ConfigElement extends HTMLElement {
  shadowRoot = attachHtml(template, this);

  unsubs: any[] = [];

  connectedCallback() {
    this.unsubs.push(
      subscribe(
        port,
        "config",
        ({ value }) => {
          console.log("config available", value);
        },
        undefined
      )
    );

    this.shadowRoot.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(this.shadowRoot.querySelector("form")!);
      const config = [...formData.entries()];
      request(port, "setConfig", config);
    });
  }

  disconnectedCallback() {
    this.unsubs.forEach((f) => f());
  }
}
