import type { SetRemote, WatchRemote } from "../../routes";
import { attachHtml } from "../../utils/dom/factory";
import { request, subscribe } from "../../utils/rpc/client";
import { RemoteType } from "../db";
import { port } from "../global/port";
import template from "./config-form.html";

export class ConfigElement extends HTMLElement {
  shadowRoot = attachHtml(template, this);

  unsubs: any[] = [];

  connectedCallback() {
    this.unsubs.push(
      subscribe<WatchRemote>(port, "watchRemote", ({ value }) => {
        console.log("config received", value);
      })
    );

    this.shadowRoot.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(this.shadowRoot.querySelector("form")!);
      request<SetRemote>(port, "setRemote", {
        type: RemoteType.GitHubToken,
        connection: {
          owner: formData.get("owner") as string,
          repo: formData.get("repo") as string,
          token: formData.get("token") as string,
        },
      });
    });
  }

  disconnectedCallback() {
    this.unsubs.forEach((f) => f());
  }
}
