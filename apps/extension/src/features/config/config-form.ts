import type { SetRemote, WatchRemote } from "../../routes";
import { attachHtml } from "../../utils/dom/factory";
import { request, subscribe } from "../../utils/rpc/client";
import { RemoteType } from "../db";
import { port } from "../global/port";
import template from "./config-form.html";

export class ConfigElement extends HTMLElement {
  shadowRoot = attachHtml(template, this);
  cleanupFns: Function[] = [];

  connectedCallback() {
    this.cleanupFns.push(
      subscribe<WatchRemote>(port, "watchRemote", ({ value }) => {
        const form = this.shadowRoot.querySelector("form")!;
        Object.entries(value?.connection ?? {}).map(
          ([k, v]) => (form.querySelector<HTMLInputElement>(`[name="${k}"]`)!.value = v as string)
        );
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
    this.cleanupFns.forEach((f) => f());
  }
}
